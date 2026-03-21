const Bike = require("../models/Bike");
const Booking = require("../models/Booking");

/** 📊 OWNER INTELLIGENCE: DASHBOARD STATS, REVENUE & TRENDS */
exports.getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // 1. Fetch Fleet Assets belonging to this owner
    const myBikes = await Bike.find({ owner: ownerId }).lean();
    
    // Convert IDs to strings explicitly to match your custom String-based _id schema
    const bikeIds = myBikes.map(b => b._id.toString());

    // 🛡️ Safety: If no bikes, return empty stats immediately
    if (bikeIds.length === 0) {
      return res.json({
        success: true,
        stats: { totalBikes: 0, earnings: 0, activeRentals: 0, availableUnits: 0 },
        revenueTrend: [],
        myBikes: [],
        activeRentals: []
      });
    }

    // 2. Fetch Aggregated Data with Casting Safety
    const [earningsData, revenueTrend] = await Promise.all([
      // A. Total Earnings Calculation
      Booking.aggregate([
        { 
          $match: { 
            // We match the raw value to avoid ObjectId casting issues
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

      // B. Weekly Revenue Trend
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

    // 3. Fetch Active Rental Stream
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
    console.error("🚨 CRITICAL BACKEND ERROR:", error);
    res.status(500).json({ 
        success: false, 
        message: "Dashboard calculation error. Verify asset IDs are consistent." 
    });
  }
};

/** 🏍️ FLEET OPERATIONS: ADD NEW UNIT */
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

/** 🔧 FLEET OPERATIONS: UPDATE ASSET */
exports.updateOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!bike) return res.status(403).json({ 
      success: false, 
      message: "Unauthorized: Access Denied." 
    });
    
    res.json({ success: true, bike });
  } catch (error) { 
    res.status(400).json({ success: false, message: error.message }); 
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

/** 🗑️ FLEET OPERATIONS: DELETE UNIT */
exports.deleteOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    
    if (!bike) return res.status(403).json({ 
      success: false, 
      message: "Deletion blocked: Ownership not verified." 
    });
    
    res.json({ success: true, message: "Unit decommissioned." });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};