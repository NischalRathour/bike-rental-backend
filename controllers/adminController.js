const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");

// Get REAL dashboard statistics from database
exports.getDashboardStats = async (req, res) => {
  try {
    console.log("📊 Admin dashboard requested by:", req.user?.email || "Unknown");
    
    // ✅ 1. Get REAL counts from database
    const totalBookings = await Booking.countDocuments();
    const totalBikes = await Bike.countDocuments();
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } }); // Only count non-admin users
    
    console.log("📈 Database counts:", { totalBookings, totalBikes, totalUsers });
    
    // ✅ 2. Calculate REAL total revenue from PAID bookings
    const revenueResult = await Booking.aggregate([
      { 
        $match: { 
          paymentStatus: { $in: ["Paid", "paid", "completed"] } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$totalPrice" } 
        } 
      }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    // ✅ 3. Get REAL booking status counts
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ["Confirmed", "confirmed", "active"] } 
    });
    
    const pendingBookings = await Booking.countDocuments({ 
      status: { $in: ["Pending", "pending"] } 
    });
    
    const cancelledBookings = await Booking.countDocuments({ 
      status: { $in: ["Cancelled", "cancelled"] } 
    });
    
    // ✅ 4. Get REAL recent bookings (last 10)
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email phone')
      .populate('bike', 'name model pricePerHour')
      .lean(); // Convert to plain objects
    
    console.log("📋 Recent bookings found:", recentBookings.length);
    
    // ✅ 5. Get REAL revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const revenueByMonth = await Booking.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["Paid", "paid", "completed"] },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);
    
    // ✅ 6. Get REAL most popular bikes
    const popularBikes = await Booking.aggregate([
      {
        $match: {
          bike: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$bike",
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 }
    ]);
    
    // ✅ 7. Get bike names for popular bikes
    let bikeDetails = [];
    if (popularBikes.length > 0) {
      const bikeIds = popularBikes.map(b => b._id);
      const bikes = await Bike.find({ _id: { $in: bikeIds } }, 'name model');
      
      // Create a map for easy lookup
      const bikeMap = {};
      bikes.forEach(bike => {
        bikeMap[bike._id.toString()] = `${bike.name} ${bike.model ? `(${bike.model})` : ''}`.trim();
      });
      
      bikeDetails = popularBikes.map(bike => ({
        name: bikeMap[bike._id.toString()] || 'Unknown Bike',
        bookings: bike.bookings,
        revenue: bike.revenue
      }));
    }
    
    // ✅ 8. Calculate monthly growth (if we have last month's data)
    let monthlyGrowth = 0;
    if (revenueByMonth.length >= 2) {
      const currentMonth = revenueByMonth[revenueByMonth.length - 1]?.revenue || 0;
      const previousMonth = revenueByMonth[revenueByMonth.length - 2]?.revenue || 0;
      
      if (previousMonth > 0) {
        monthlyGrowth = ((currentMonth - previousMonth) / previousMonth) * 100;
      }
    }
    
    console.log("✅ Dashboard data fetched successfully!");
    
    // ✅ 9. Return REAL data
    res.json({
      success: true,
      stats: {
        totalBookings,
        totalBikes,
        totalUsers,
        totalRevenue,
        activeBookings,
        pendingBookings,
        cancelledBookings,
        monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2))
      },
      recentBookings,
      revenueByMonth,
      popularBikes: bikeDetails,
      timestamp: new Date().toISOString(),
      dataSource: "REAL_DATABASE"
    });

  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};