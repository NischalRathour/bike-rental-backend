const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");

// --- 📊 1. OPERATIONS INTELLIGENCE (DASHBOARD) ---
exports.getDashboardStats = async (req, res) => {
  try {
    // Run all counts and aggregations simultaneously for maximum speed
    const [statsAggregation, totalBookings, availableBikes, totalUsers] = await Promise.all([
      Booking.aggregate([
        {
          $facet: {
            "financials": [
              { $match: { paymentStatus: { $in: ["Paid", "paid"] } } },
              { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } }}
            ],
            "revenueTrend": [
              { $match: { paymentStatus: { $in: ["Paid", "paid"] } } },
              { $group: {
                  _id: { $dayOfWeek: "$createdAt" },
                  revenue: { $sum: "$totalPrice" }
              }},
              { $sort: { "_id": 1 } }
            ],
            "bikePopularity": [
              { $unwind: "$bikes" },
              { $group: { _id: "$bikes", count: { $sum: 1 } } },
              { $lookup: { from: "bikes", localField: "_id", foreignField: "_id", as: "bikeDetails" } },
              { $unwind: "$bikeDetails" },
              { $project: { name: "$bikeDetails.name", count: 1 } },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ]
          }
        }
      ]),
      Booking.countDocuments(),
      Bike.countDocuments({ status: "Available" }),
      User.countDocuments({ role: "customer" })
    ]);

    // Safety check for empty aggregation results
    const result = statsAggregation[0] || {};
    const revenue = result.financials?.[0]?.totalRevenue ?? 0;
    const trend = result.revenueTrend ?? [];
    const bikeStats = result.bikePopularity || [];

    // Fetch the 6 most recent bookings for the activity feed
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name email")
      .populate("bikes", "name") 
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        revenue,
        users: totalUsers,
        bookings: totalBookings,
        availableBikes,
        co2: (totalBookings * 2.4).toFixed(1),
        revenueTrend: trend
      },
      bikeStats,
      recentBookings: recentBookings || []
    });
  } catch (error) { 
    console.error("🚨 Dashboard Stats Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Intelligence Error" }); 
  }
};

// --- 👤 2. USER MANAGEMENT ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteUserAdmin = async (req, res) => {
  try {
    // Security check: Prevents an admin from deleting themselves via their own session
    if (req.params.id === req.user.id) {
        return res.status(400).json({ success: false, message: "Security Breach: Admin cannot self-delete." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User account purged successfully." });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// --- 🏍️ 3. FLEET MANAGEMENT ---
exports.addBikeAdmin = async (req, res) => {
  try {
    const bike = await Bike.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.updateBikeAdmin = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.updateBikeStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const bike = await Bike.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: `Bike status updated to ${status}`, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteBikeAdmin = async (req, res) => {
  try {
    await Bike.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Bike unit decommissioned." });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

// --- 📋 4. BOOKING MANAGEMENT ---
exports.getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
        .populate("user", "name email")
        .populate("bikes", "name")
        .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // Synchronization logic: When a booking is confirmed, set all linked bikes to 'Rented'
    if (status === 'Confirmed') {
        await Bike.updateMany({ _id: { $in: booking.bikes } }, { status: 'Rented' });
    } else if (status === 'Cancelled' || status === 'Completed') {
        await Bike.updateMany({ _id: { $in: booking.bikes } }, { status: 'Available' });
    }

    res.json({ success: true, booking });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteBookingAdmin = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking record purged." });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// --- 📄 5. REPORTS ---
exports.generateReportData = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { paymentStatus: { $in: ['Paid', 'paid'] } } },
      { $group: { _id: null, rev: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);
    res.json({ 
        success: true, 
        report: { 
            generatedAt: new Date().toLocaleString(),
            status: "Fleet Operational",
            metrics: { 
                grossRevenue: stats[0]?.rev || 0, 
                totalConfirmed: stats[0]?.count || 0,
                ecoImpact: ((stats[0]?.count || 0) * 2.4).toFixed(1) + " KG CO2"
            } 
        } 
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};