const Bike = require("../models/Bike");
const Booking = require("../models/Booking");

/** 📊 OWNER INTELLIGENCE: DASHBOARD STATS & REVENUE */
exports.getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // 1. Fetch Fleet Assets
    const myBikes = await Bike.find({ owner: ownerId });
    const bikeIds = myBikes.map(b => b._id);

    // 2. Fetch Aggregated Earnings
    const earningsData = await Booking.aggregate([
      { $match: { bike: { $in: bikeIds }, paymentStatus: { $in: ["Paid", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);

    // 3. Fetch Active Rental Stream
    const activeRentals = await Booking.find({ 
      bike: { $in: bikeIds },
      status: { $in: ["Confirmed", "Pending"] }
    })
    .populate("user", "name email")
    .populate("bike", "name images")
    .sort({ startDate: 1 });

    res.json({
      success: true,
      stats: {
        totalBikes: myBikes.length,
        earnings: earningsData[0]?.total || 0,
        activeRentals: activeRentals.length,
        availableUnits: myBikes.filter(b => b.status === "Available").length
      },
      myBikes,
      activeRentals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** 🏍️ FLEET OPERATIONS: CRUD */
exports.addOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.updateOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!bike) return res.status(403).json({ success: false, message: "Unauthorized edit" });
    res.json({ success: true, bike });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.toggleMaintenance = async (req, res) => {
  try {
    const bike = await Bike.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(404).json({ success: false, message: "Bike not found" });

    const newStatus = bike.status === 'Maintenance' ? 'Available' : 'Maintenance';
    bike.status = newStatus;
    await bike.save();
    res.json({ success: true, status: newStatus });
  } catch (error) { res.status(500).json({ success: false, message: "Sync failed" }); }
};

exports.deleteOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(403).json({ success: false, message: "Access Denied" });
    res.json({ success: true, message: "Unit decommissioned." });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};