const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");

/** 📊 SYSTEM INTELLIGENCE: DASHBOARD STATS */
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
    const totalBikes = await Bike.countDocuments();
    const totalUsers = await User.countDocuments({ role: "customer" });
    const availableBikes = await Bike.countDocuments({ status: "Available" });

    res.json({
      success: true,
      stats: {
        totalBookings, totalBikes, totalUsers, availableBikes,
        totalRevenue: statsAggregation[0].financials[0]?.totalRevenue || 0,
        totalCo2Saved: (totalBookings * 10 * 0.15).toFixed(2),
        ecoScore: Math.min(100, (totalBookings * 1.5).toFixed(0)),
        revenueTrend: statsAggregation[0].revenueTrend
      },
      recentBookings: await Booking.find().sort({ createdAt: -1 }).limit(6).populate("user", "name email").populate("bike", "name")
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/** 👤 IDENTITY INTELLIGENCE: GET ALL USERS */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/** 🏍️ FLEET MANAGEMENT */
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

exports.deleteBikeAdmin = async (req, res) => {
  try {
    await Bike.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Bike Deleted" });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

/** 📋 BOOKING MANAGEMENT */
exports.updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, booking });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteBookingAdmin = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/** 📄 REPORT GENERATION */
exports.generateReportData = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    res.json({ success: true, report: { generatedAt: new Date().toLocaleString(), totalBookings } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};