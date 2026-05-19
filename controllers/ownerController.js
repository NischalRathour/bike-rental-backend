const Bike = require("../models/Bike");
const Booking = require("../models/Booking");

/** * 📊 OWNER DASHBOARD: MULTI-VENDOR DATA AGGREGATION 
 * Restricts telemetry calculations exclusively to the authenticated vendor session context.
 */
exports.getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // 1. Fetch Fleet Assets belonging strictly to this owner
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

    // 2. Fetch Aggregated Data (Earnings and Weekly Trends) via High-Performance Pipelines
    const [earningsData, revenueTrend] = await Promise.all([
      Booking.aggregate([
        { 
          $match: { 
            // Handles match verification for string-based custom identifiers
            $or: [
              { bikes: { $in: bikeIds } },
              { bikeId: { $in: bikeIds } }
            ],
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
            $or: [
              { bikes: { $in: bikeIds } },
              { bikeId: { $in: bikeIds } }
            ],
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

    // 3. Fetch Active Reservations pointing back to this owner's exact assets
    const activeRentals = await Booking.find({ 
      $or: [
        { bikes: { $in: bikeIds } },
        { bikeId: { $in: bikeIds } }
      ],
      status: { $in: ["Confirmed", "Pending"] }
    })
    .populate("user", "name email phone")
    .populate("bikes", "name images price cc")
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
    console.error("Dashboard Aggregation Pipeline Error:", error);
    res.status(500).json({ success: false, message: "Dashboard calculations failed mapping constraints." });
  }
};

/** 🏍️ FLEET OPERATIONS: PROVISION NEW UNIT */
exports.addOwnerBike = async (req, res) => {
  try {
    const { _id, name, brand, price, type, cc, images, description, features } = req.body;

    // 1. Strict Structural Validation Gate
    if (!_id || !name || !brand || !price) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing Required Fields: ID, Name, Brand, and Price are mandatory parameters." 
      });
    }

    // 2. Collision Check: Guard unique custom primary key indices
    const bikeExists = await Bike.findById(_id);
    if (bikeExists) {
      return res.status(400).json({ success: false, message: "This machine registration index already exists in the central ledger." });
    }

    // 3. Document Creation with Explicit Data Sanitization & Explicit Casting
    const bike = await Bike.create({ 
      _id: _id.trim(),
      name: name.trim(), 
      brand: brand.trim(), 
      price: Number(price), 
      type: type || "Commuter", 
      // Strips text formatting safely to pass clean numeric integers to the CC schema field
      cc: cc ? Number(String(cc).replace(/cc/gi, '')) : 150, 
      description: description || "Premium rental bike in Kathmandu.",
      features: Array.isArray(features) ? features : [], 
      images: (images && images.length > 0 && images[0] !== "") ? images : ["/images/default-bike.jpg"],
      owner: req.user.id, // Explicit tracking link binding asset creation to active session profile
      available: true,
      status: "Ready"
    });

    res.status(201).json({ success: true, bike });
  } catch (error) { 
    console.error("Asset Provisioning Engine Failure:", error.message);
    res.status(400).json({ success: false, message: error.message }); 
  }
};

/** 🔧 FLEET OPERATIONS: UPDATE ASSET METADATA */
exports.updateOwnerBike = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Enforce data sanitization on variable structural updates
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.cc) updateData.cc = Number(String(updateData.cc).replace(/cc/gi, ''));
    if (updateData.features && !Array.isArray(updateData.features)) updateData.features = [];

    // 🔒 Bounded Query: Encapsulates ownership confirmation checks before writing delta updates to the collection
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!bike) return res.status(403).json({ success: false, message: "Access Denied: Resource unauthorized or document context missing." });
    res.json({ success: true, bike });
  } catch (error) { 
    res.status(400).json({ success: false, message: error.message }); 
  }
};

/** 🗑️ FLEET OPERATIONS: DECOMMISSION UNIT */
exports.deleteOwnerBike = async (req, res) => {
  try {
    // 🔒 Bounded Query: Secures deletion mutations behind session verification tokens
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(403).json({ success: false, message: "Mutation blocked: Context mismatch or record unauthorized." });
    
    res.json({ success: true, message: "Unit successfully decommissioned and scrubbed from fleet registries." });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

/** 🛠️ FLEET OPERATIONS: TOGGLE TELEMETRY MAINTENANCE STATE */
exports.toggleMaintenance = async (req, res) => {
  try {
    // 🔒 Bounded Query: Verification validation boundaries
    const bike = await Bike.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bike) return res.status(404).json({ success: false, message: "Asset verification key mismatch." });

    // Atomic telemetry tracking logic swap
    bike.available = !bike.available;
    bike.status = bike.available ? 'Ready' : 'Maintenance';
    await bike.save();
    
    res.json({ success: true, status: bike.status, available: bike.available });
  } catch (error) { 
    res.status(500).json({ success: false, message: "Fleet tracking status synchronization failure." }); 
  }
};