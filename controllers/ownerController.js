const Bike = require("../models/Bike");
const Booking = require("../models/Booking");

/** 📊 OWNER DASHBOARD: DATA AGGREGATION */
exports.getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // 1. Fetch Fleet Assets belonging to this owner
    const myBikes = await Bike.find({ owner: ownerId }).lean();
    const bikeIds = myBikes.map(b => b._id.toString());

    if (bikeIds.length === 0) {
      return res.json({
        success: true,
        stats: { totalBikes: 0, earnings: 0, activeRentals: 0, availableUnits: 0 },
        revenueTrend: [],
        myBikes: [],
        activeRentals: []
      });
    }

    // 2. Fetch Aggregated Data
    const [earningsData, revenueTrend] = await Promise.all([
      Booking.aggregate([
        { 
          $match: { 
            bikes: { $in: bikeIds }, 
            paymentStatus: { $in: ["Paid", "paid"] } 
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: { $ifNull: ["$totalPrice", 0] } } 
          } 
        }
      ]),
      Booking.aggregate([
        { 
          $match: { 
            bikes: { $in: bikeIds }, 
            paymentStatus: { $in: ["Paid", "paid"] } 
          } 
        },
        { 
          $group: {
            _id: { $dayOfWeek: { $ifNull: ["$createdAt", new Date()] } },
            amount: { $sum: { $ifNull: ["$totalPrice", 0] } }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    const activeRentals = await Booking.find({ 
      bikes: { $in: bikeIds },
      status: { $in: ["Confirmed", "Pending"] }
    })
    .populate("user", "name email")
    .populate("bikes", "name images")
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      stats: {
        totalBikes: myBikes.length,
        earnings: (earningsData && earningsData.length > 0) ? earningsData[0].total : 0,
        activeRentals: activeRentals.length,
        availableUnits: myBikes.filter(b => b.available === true).length
      },
      revenueTrend: revenueTrend || [], 
      myBikes, 
      activeRentals
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Dashboard calculation error." });
  }
};

/** 🏍️ FLEET OPERATIONS: ADD NEW UNIT */
exports.addOwnerBike = async (req, res) => {
  try {
    const { _id, name, brand, price, type, cc, images, description } = req.body;

    // Strict Validation to prevent 400 Bad Request
    if (!_id || !name || !brand || !price) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing Required Fields: ID, Name, Brand, and Price must be provided." 
      });
    }

    // Check for duplicate ID
    const bikeExists = await Bike.findById(_id);
    if (bikeExists) {
      return res.status(400).json({ success: false, message: "This Bike ID already exists in our Kathmandu fleet." });
    }

    const bike = await Bike.create({ 
      _id,
      name, 
      brand, 
      price, 
      type: type || "Commuter", 
      cc: cc || "150cc", 
      description: description || "Premium rental bike in Kathmandu.",
      images: images && images[0] !== "" ? images : ["/images/default-bike.jpg"],
      owner: req.user.id,
      available: true
    });

    res.status(201).json({ success: true, bike });
  } catch (error) { 
    console.error("Add Bike Error:", error.message);
    res.status(400).json({ success: false, message: error.message }); 
  }
};

/** 🔧 FLEET OPERATIONS: UPDATE ASSET */
exports.updateOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!bike) return res.status(403).json({ success: false, message: "Unauthorized: Access Denied." });
    res.json({ success: true, bike });
  } catch (error) { 
    res.status(400).json({ success: false, message: error.message }); 
  }
};

/** 🗑️ FLEET OPERATIONS: DELETE UNIT */
exports.deleteOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(403).json({ success: false, message: "Deletion blocked." });
    res.json({ success: true, message: "Unit decommissioned." });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

/** 🛠️ FLEET OPERATIONS: TOGGLE MAINTENANCE */
exports.toggleMaintenance = async (req, res) => {
  try {
    const bike = await Bike.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(404).json({ success: false, message: "Asset not found" });

    bike.available = !bike.available;
    bike.status = bike.available ? 'Available' : 'Maintenance';
    await bike.save();
    res.json({ success: true, status: bike.status, available: bike.available });
  } catch (error) { 
    res.status(500).json({ success: false, message: "Sync failed" }); 
  }
};