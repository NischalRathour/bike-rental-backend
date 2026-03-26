const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");

// --- 📊 1. OPERATIONS INTELLIGENCE (DASHBOARD) ---
/**
 * 🛰️ Fetches real-time telemetry including Revenue Trends, Bike Popularity, 
 * and Environmental Impact (CO2) metrics.
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Phase 1: Heavy Lift Aggregation & Base Counts
    const [statsAggregation, totalBookings, availableBikes, totalUsers] = await Promise.all([
      Booking.aggregate([
        {
          $facet: {
            "financials": [
              { $match: { paymentStatus: { $regex: /paid/i } } }, // Case-insensitive match for "Paid"
              { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } }}
            ],
            "revenueTrend": [
              { $match: { paymentStatus: { $regex: /paid/i } } },
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
      User.countDocuments()
    ]);

    const result = statsAggregation[0] || {};
    const revenue = result.financials?.[0]?.totalRevenue ?? 0;
    const trend = result.revenueTrend ?? [];
    const bikeStats = result.bikePopularity || [];

    // Phase 2: Recent Activity (Traffic Nodes)
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
        // Formula: 2.4kg of CO2 saved per average bike rental vs car
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

// --- 👤 2. IDENTITY DIRECTORY (USER MANAGEMENT) ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (error) { 
    res.status(500).json({ success: false, message: "Directory Fetch Failed." }); 
  }
};

exports.deleteUserAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ success: false, message: "Security Breach: Admin cannot self-purge." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Identity node purged successfully." });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// --- 🏍️ 3. FLEET COMMAND (BIKE MANAGEMENT) ---
exports.addBikeAdmin = async (req, res) => {
  try {
    const bike = await Bike.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.updateBikeAdmin = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.updateBikeStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const bike = await Bike.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: `Node ${req.params.id} updated to ${status}`, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteBikeAdmin = async (req, res) => {
  try {
    await Bike.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Bike unit decommissioned from fleet." });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

// --- 📋 4. BOOKING OPERATIONS ---
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

    // 🔄 AUTOMATION: Manage Bike Lifecycle based on Booking State
    if (status === 'Confirmed') {
        await Bike.updateMany({ _id: { $in: booking.bikes } }, { status: 'Rented' });
    } else if (['Cancelled', 'Completed', 'Rejected'].includes(status)) {
        await Bike.updateMany({ _id: { $in: booking.bikes } }, { status: 'Available' });
    }

    res.json({ success: true, booking });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteBookingAdmin = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking record purged from ledger." });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// --- 📄 5. FISCAL REPORTS ---
exports.generateReportData = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { paymentStatus: { $regex: /paid/i } } },
      { $group: { _id: null, rev: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);
    res.json({ 
        success: true, 
        report: { 
            generatedAt: new Date().toISOString(),
            status: "Operational High",
            metrics: { 
                grossRevenue: stats[0]?.rev || 0, 
                totalConfirmed: stats[0]?.count || 0,
                ecoImpact: ((stats[0]?.count || 0) * 2.4).toFixed(1) + " KG CO2 Saved"
            } 
        } 
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};