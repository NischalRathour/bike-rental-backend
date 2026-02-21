const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");

/**
 * 📊 GET DASHBOARD STATS
 * Fetches counts, revenue, and eco-telemetry for the Command Center.
 */
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

    // 3. 🌿 Calculate Eco-Tracking Telemetry (10km avg per booking)
    const totalKmRidden = totalBookings * 10; 
    const totalCo2Saved = (totalKmRidden * 0.15).toFixed(2);

    // 4. 🏆 Gamification: Fleet Eco-Score (Capped at 100)
    const ecoScore = Math.min(100, (totalBookings * 1.5).toFixed(0));

    // 5. Get Recent Bookings with details
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name email")
      .populate("bike", "name");

    res.json({
      success: true,
      user: req.user,
      stats: {
        totalBookings,
        totalBikes,
        totalUsers,
        totalRevenue: revenueResult[0]?.total || 0,
        pendingBookings: await Booking.countDocuments({ status: "Pending" }),
        totalCo2Saved,
        ecoScore
      },
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🏍️ FLEET MANAGEMENT: ADD BIKE
 */
exports.addBikeAdmin = async (req, res) => {
  try {
    const { name, brand, price, co2SavedPerKm } = req.body;
    const bike = await Bike.create({
      name,
      brand,
      price,
      co2SavedPerKm,
      owner: req.user.id // Assign to admin ID from protected session
    });
    res.status(201).json({ success: true, bike });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 🏍️ FLEET MANAGEMENT: UPDATE BIKE
 */
exports.updateBikeAdmin = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!bike) return res.status(404).json({ success: false, message: "Bike not found" });
    res.json({ success: true, bike });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 🏍️ FLEET MANAGEMENT: DELETE BIKE
 */
exports.deleteBikeAdmin = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndDelete(req.params.id);
    if (!bike) return res.status(404).json({ success: false, message: "Bike not found" });
    res.json({ success: true, message: "Bike removed from inventory" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 📋 BOOKING MANAGEMENT: UPDATE STATUS
 */
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

/**
 * 📋 BOOKING MANAGEMENT: DELETE BOOKING
 */
exports.deleteBookingAdmin = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    res.json({ success: true, message: "Record removed from Kathmandu database" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 📄 REPORT GENERATION
 */
exports.generateReportData = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$totalPrice" } } }
    ]);
    const report = {
      generatedAt: new Date().toLocaleString(),
      fleetSummary: stats,
      ecoImpact: {
        totalCo2Saved: (await Booking.countDocuments() * 10 * 0.15).toFixed(2) + " KG",
        sustainabilityRating: "Excellent"
      }
    };
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};