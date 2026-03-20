const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");

// --- 📊 1. OPERATIONS INTELLIGENCE (DASHBOARD) ---
exports.getDashboardStats = async (req, res) => {
  try {
    const statsAggregation = await Booking.aggregate([
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
          ]
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments();
    const availableBikes = await Bike.countDocuments({ status: "Available" });
    const totalUsers = await User.countDocuments({ role: "customer" });

    res.json({
      success: true,
      stats: {
        revenue: statsAggregation[0].financials[0]?.totalRevenue || 0,
        users: totalUsers,
        bookings: totalBookings,
        availableBikes: availableBikes,
        co2: (totalBookings * 2.4).toFixed(1), // Sustainability logic
        revenueTrend: statsAggregation[0].revenueTrend
      },
      recentBookings: await Booking.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("user", "name email")
        .populate("bike", "name")
    });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

// --- 👤 2. USER MANAGEMENT ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteUserAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: "Security: Admin cannot delete self." });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User account successfully removed." });
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
    res.json({ success: true, message: `Status updated to ${status}`, bike });
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
    const bookings = await Booking.find().populate("user", "name email").populate("bike", "name").sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (status === 'Confirmed') await Bike.findByIdAndUpdate(booking.bike, { status: 'Rented' });
    else if (status === 'Cancelled' || status === 'Completed') await Bike.findByIdAndUpdate(booking.bike, { status: 'Available' });
    res.json({ success: true, booking });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteBookingAdmin = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Record purged." });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// --- 📄 5. REPORTS ---
exports.generateReportData = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { paymentStatus: { $in: ['Paid', 'paid'] } } },
      { $group: { _id: null, rev: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);
    res.json({ success: true, report: { generatedAt: new Date().toLocaleString(), status: "Operational", metrics: { grossRevenue: stats[0]?.rev || 0, totalConfirmed: stats[0]?.count || 0, ecoImpact: ((stats[0]?.count || 0) * 2.4).toFixed(1) + " KG CO2" } } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};