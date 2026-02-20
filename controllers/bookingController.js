const Booking = require("../models/Booking");

// CUSTOMER: create booking
exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      user: req.user._id,
      status: 'Pending' // Explicitly set starting status
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// CUSTOMER: view own bookings
exports.getMyBookings = async (req, res) => {
  try {
    console.log(`📋 Fetching bookings for user: ${req.user.id}`);
    const bookings = await Booking.find({ user: req.user._id })
      .populate("bike", "name price pricePerHour image")
      .sort({ createdAt: -1 }); // Show newest first
    
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get specific booking by ID
exports.getBookingById = async (req, res) => {
  try {
    console.log(`🔍 Fetching booking ID: ${req.params.id}`);
    
    const booking = await Booking.findById(req.params.id)
      .populate("bike", "name price pricePerHour image")
      .populate("user", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization: Owner or Admin only
    const isOwner = booking.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Invalid ID format or Server Error" });
  }
};

// ✅ Update booking with payment
exports.updateBookingWithPayment = async (req, res) => {
  try {
    console.log(`💰 Updating booking ${req.params.id} with payment`);
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🛠 FIX: Capitalized 'Confirmed' to match your Model's enum
    booking.status = 'Confirmed'; 
    booking.paymentStatus = 'Paid'; // Added for extra clarity in UI
    booking.paymentId = req.body.paymentId;
    booking.paymentDate = new Date();
    booking.paymentAmount = req.body.amount;
    
    const updatedBooking = await booking.save();
    
    console.log(`✅ Booking ${booking._id} marked as Paid/Confirmed`);
    res.json({ success: true, booking: updatedBooking });
    
  } catch (error) {
    console.error(`❌ Validation Error:`, error.message);
    res.status(400).json({ message: error.message });
  }
};

// ADMIN: view all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("bike", "name price pricePerHour")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: update booking status (Manual)
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};