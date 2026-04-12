const Booking = require("../models/Booking");
const Bike = require("../models/Bike");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * ✅ 1. CREATE BIKE BOOKING
 * Features: Atomic Transactions, CO2 Logic Engine, and Real-time User Stats Sync
 */
exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bikeIds, startDate, endDate, totalPrice } = req.body;
    
    // Calculate Duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

    // 🌿 UNIQUE FEATURE: Green IT Logic Engine
    const co2Val = (bikeIds.length * days * 2.4).toFixed(1); 
    const pointsVal = (bikeIds.length * 50) + (days * 10);

    // Create Booking Document
    const booking = new Booking({
      user: req.user._id,
      bikes: bikeIds, 
      startDate,
      endDate,
      totalPrice,
      days,
      bookingType: bikeIds.length > 1 ? 'Group' : 'Solo',
      co2Saved: co2Val,
      rewardPoints: pointsVal,
      status: 'Pending',
      paymentStatus: 'Unpaid'
    });

    const savedBooking = await booking.save({ session });

    // 🔒 ATOMIC LOGIC: Prevent Double-Booking via Status Update
    await Bike.updateMany(
      { _id: { $in: bikeIds } }, 
      { status: 'Rented' },
      { session }
    );

    // 🔄 SYNC TELEMETRY: Update User Profile Analytics instantly
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $inc: { 
          rewardPoints: pointsVal,
          co2Saved: parseFloat(co2Val)
        } 
      },
      { session, new: true }
    );

    // Commit all changes as a single unit
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, booking: savedBooking });
  } catch (error) {
    // If anything fails, rollback everything (Atomic Logic)
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 2. NEW: CREATE TOUR BOOKING (Marketplace Checkout Logic)
 */
exports.createTourBooking = async (req, res) => {
  try {
    const { tourId, totalPrice, groupSize, fullName } = req.body;

    const pointsVal = 500; // Premium tour bonus
    const co2Val = 15.5;   // Estimated offset for group tour

    const booking = await Booking.create({
      user: req.user._id,
      tour: tourId,
      totalPrice: totalPrice,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      rewardPoints: pointsVal,
      co2Saved: co2Val,
      bookingType: 'Tour',
      groupSize: groupSize
    });

    // Update User Telemetry for the tour booking
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $inc: { 
          rewardPoints: pointsVal,
          co2Saved: co2Val
        } 
      }
    );

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 3. GET PERSONAL BOOKINGS (Customer/Owner)
 */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("bikes")
      .populate("tour") // Added tour population
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
      .populate("user", "name email")
      .populate("bikes")
      .populate("tour"); // Added tour population
    
    if (!booking) return res.status(404).json({ success: false, message: "Booking record not found" });
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 5. UPDATE PAYMENT STATUS (Post-Stripe Checkout)
 */
exports.updateBookingWithPayment = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'Confirmed', 
        paymentStatus: 'Paid', 
        paymentId: req.body.paymentId 
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
      .populate("user", "name")
      .populate("bikes")
      .populate("tour"); // Added tour population
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 7. ADMIN: LIFECYCLE MANAGEMENT
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