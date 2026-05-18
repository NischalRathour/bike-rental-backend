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

    // 2. Fetch Aggregated Data (Earnings and Trends)
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
    const { _id, name, brand, price, type, cc, images, description, features } = req.body;

    // 1. Strict Validation: Ensure mandatory fields are present
    if (!_id || !name || !brand || !price) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing Required Fields: ID, Name, Brand, and Price are mandatory." 
      });
    }

    // 2. Check for duplicate ID
    const bikeExists = await Bike.findById(_id);
    if (bikeExists) {
      return res.status(400).json({ success: false, message: "This Bike ID already exists in the fleet." });
    }

    // 3. Create Bike with Data Sanitization
    const bike = await Bike.create({ 
      _id: _id.trim(),
      name: name.trim(), 
      brand: brand.trim(), 
      price: Number(price), // Explicitly cast to Number
      type: type || "Commuter", 
      // Cleans "150cc" strings to Number 150
      cc: cc ? Number(String(cc).replace(/cc/gi, '')) : 150, 
      description: description || "Premium rental bike in Kathmandu.",
      features: features || [], 
      images: (images && images.length > 0 && images[0] !== "") ? images : ["/images/default-bike.jpg"],
      owner: req.user.id, 
      available: true,
      status: "Ready"
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
    const updateData = { ...req.body };
    
    // Ensure numeric fields are cast correctly if they are being updated
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.cc) updateData.cc = Number(String(updateData.cc).replace(/cc/gi, ''));

    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!bike) return res.status(403).json({ success: false, message: "Unauthorized or Asset not found." });
    res.json({ success: true, bike });
  } catch (error) { 
    res.status(400).json({ success: false, message: error.message }); 
  }
};

/** 🗑️ FLEET OPERATIONS: DELETE UNIT */
exports.deleteOwnerBike = async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(403).json({ success: false, message: "Deletion blocked or unauthorized." });
    res.json({ success: true, message: "Unit decommissioned successfully." });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

/** 🛠️ FLEET OPERATIONS: TOGGLE MAINTENANCE */
exports.toggleMaintenance = async (req, res) => {
  try {
    const bike = await Bike.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(404).json({ success: false, message: "Asset not found." });

    bike.available = !bike.available;
    bike.status = bike.available ? 'Ready' : 'Maintenance';
    await bike.save();
    
    res.json({ success: true, status: bike.status, available: bike.available });
  } catch (error) { 
    res.status(500).json({ success: false, message: "Status sync failed." }); 
  }
};