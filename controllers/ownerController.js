const Bike = require("../models/Bike");
const Booking = require("../models/Booking");

/** 🚲 FETCH OWNER FLEET */
exports.getOwnerBikes = async (req, res) => {
  try {
    const bikes = await Bike.find({ owner: req.user.id });
    res.json({ success: true, bikes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** ➕ ADD BIKE */
exports.addOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.create({
      ...req.body,
      owner: req.user.id
    });
    res.status(201).json({ success: true, bike });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** 📝 UPDATE BIKE */
exports.updateOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!bike) return res.status(403).json({ success: false, message: "Unauthorized edit" });
    res.json({ success: true, bike });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** 🛠️ TOGGLE MAINTENANCE STATUS */
exports.toggleMaintenance = async (req, res) => {
  try {
    const bike = await Bike.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(404).json({ success: false, message: "Bike not found" });

    if (bike.status === 'Rented') {
      return res.status(400).json({ 
        success: false, 
        message: "Unit is currently with a client. Cannot enter maintenance." 
      });
    }

    const newStatus = bike.status === 'Maintenance' ? 'Available' : 'Maintenance';
    bike.status = newStatus;
    bike.available = (newStatus === 'Available');
    
    await bike.save();
    res.json({ success: true, status: newStatus, bike });
  } catch (error) {
    res.status(500).json({ success: false, message: "Status sync failed." });
  }
};

/** 🗑️ DELETE BIKE */
exports.deleteOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(403).json({ success: false, message: "Access Denied" });
    res.json({ success: true, message: "Unit removed from Kathmandu records" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** 💰 EARNINGS REPORT */
exports.getOwnerEarnings = async (req, res) => {
  try {
    const ownerBikes = await Bike.find({ owner: req.user.id }).select("_id");
    const bikeIds = ownerBikes.map(bike => bike._id);

    const earningsData = await Booking.aggregate([
      { $match: { bike: { $in: bikeIds }, paymentStatus: { $in: ["Paid", "paid"] } } },
      { $group: { _id: null, totalEarnings: { $sum: "$totalPrice" }, totalRentals: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalEarnings: earningsData[0]?.totalEarnings || 0,
        totalRentals: earningsData[0]?.totalRentals || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** 🔔 LIVE RENTAL NOTIFICATIONS */
exports.getOwnerActiveRentals = async (req, res) => {
  try {
    const ownerBikes = await Bike.find({ owner: req.user.id }).select("_id");
    const bikeIds = ownerBikes.map(bike => bike._id);

    const activeRentals = await Booking.find({ 
      bike: { $in: bikeIds },
      status: { $in: ["Confirmed", "Pending"] }
    })
    .populate("user", "name email")
    .populate("bike", "name images")
    .sort({ startDate: 1 });

    res.json({ success: true, activeRentals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Notification sync failed." });
  }
};