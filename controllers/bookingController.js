const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * ✅ 1. CREATE BIKE BOOKING (SOLO/GROUP)
 * Logic: Uses Mongo Transactions to ensure Bike status, User Points, and Booking
 * are all updated together or not at all.
 */
exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bikeIds, startDate, endDate, totalPrice } = req.body;
    
    // 📅 Expedition Timing Logic
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

    // 🌿 Eco-Telemetry & Gamification Math
    const co2Val = (bikeIds.length * days * 2.4).toFixed(1); 
    const pointsVal = (bikeIds.length * 50) + (days * 10);

    const booking = new Booking({
      user: req.user._id,
      bikes: bikeIds, // ✅ Now accepts Custom String IDs (B-3699, etc.)
      startDate,
      endDate,
      totalPrice,
      bookingType: bikeIds.length > 1 ? 'Group' : 'Solo',
      co2Saved: parseFloat(co2Val),
      rewardPoints: pointsVal,
      status: 'Pending',
      paymentStatus: 'Unpaid'
    });

    // 💾 Atomic Save
    const savedBooking = await booking.save({ session });

    // 🏍️ Update Machine Status in Showroom
    // We use _id: { $in: bikeIds } because your Bike IDs are Strings
    await Bike.updateMany(
      { _id: { $in: bikeIds } }, 
      { available: false }, 
      { session }
    );

    // 👤 Sync User Gamification Data
    await User.findByIdAndUpdate(
      req.user._id, 
      { $inc: { rewardPoints: pointsVal, co2Saved: parseFloat(co2Val) } }, 
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, booking: savedBooking });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("🚨 Booking Transaction Failed:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 2. CREATE TOUR BOOKING
 */
exports.createTourBooking = async (req, res) => {
  try {
    const { tourId, totalPrice, groupSize } = req.body;
    const booking = await Booking.create({
      user: req.user._id,
      tour: tourId,
      totalPrice: totalPrice,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      rewardPoints: 500, // Premium Tour Bonus
      co2Saved: 15.5,
      bookingType: 'Tour',
      groupSize: groupSize
    });
    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 3. GET PERSONAL BOOKINGS (For "Confirmed" Ribbon & Dashboard)
 */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("bikes") // ✅ Works with custom String IDs
      .populate("tour")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 4. GET SINGLE BOOKING DETAILS
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email balance")
      .populate("bikes")
      .populate("tour");
      
    if (!booking) return res.status(404).json({ success: false, message: "Booking record not found" });
    res.json({ success: true, booking });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

/**
 * ✅ 5. UPDATE PAYMENT STATUS (Ledger Settlement)
 */
exports.updateBookingWithPayment = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'Confirmed', 
        paymentStatus: 'Paid', 
        paymentId: req.body.paymentId,
        paymentDate: Date.now()
      }, 
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) { 
    res.status(400).json({ success: false, message: error.message }); 
  }
};

/**
 * ✅ 6. ADMIN: GLOBAL FLEET OVERVIEW
 */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("bikes")
      .populate("tour");
    res.json({ success: true, bookings });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

/**
 * ✅ 7. ADMIN: MANUAL STATUS OVERRIDE
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) { 
    res.status(400).json({ success: false, message: error.message }); 
  }
};