const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Get fundamental counts
    const totalBookings = await Booking.countDocuments();
    const totalBikes = await Bike.countDocuments();
    const totalUsers = await User.countDocuments({ role: "customer" });

    // 2. Calculate Revenue (Only from Paid bookings)
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: { $in: ["Paid", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    // 3. Get Recent Bookings with details
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name email")
      .populate("bike", "name");

    // ✅ THE FIX: Include 'user: req.user' in the response.
    // This ensures AuthContext keeps the admin session alive.
    res.json({
      success: true,
      user: req.user, 
      stats: {
        totalBookings,
        totalBikes,
        totalUsers,
        totalRevenue: revenueResult[0]?.total || 0,
        pendingBookings: await Booking.countDocuments({ status: "Pending" })
      },
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: status.charAt(0).toUpperCase() + status.slice(1) },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};