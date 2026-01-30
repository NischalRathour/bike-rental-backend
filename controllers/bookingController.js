const Booking = require("../models/Booking");

// CUSTOMER: create booking
exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      user: req.user._id,
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
    const bookings = await Booking.find({ user: req.user._id })
      .populate("bike", "name price pricePerHour image");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Get specific booking by ID
exports.getBookingById = async (req, res) => {
  try {
    console.log(`🔍 Fetching booking ID: ${req.params.id}`);
    
    const booking = await Booking.findById(req.params.id)
      .populate("bike", "name price pricePerHour image")
      .populate("user", "name email");

    if (!booking) {
      console.log(`❌ Booking ${req.params.id} not found`);
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns this booking or is admin
    const isOwner = booking.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.log(`⛔ Unauthorized: User ${req.user.id} trying to access booking ${booking._id}`);
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    console.log(`✅ Booking found: ${booking._id}`);
    res.json(booking);
    
  } catch (error) {
    console.error(`❌ Error fetching booking ${req.params.id}:`, error.message);
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: view all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("bike", "name price pricePerHour");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ NEW: Update booking with payment (for customers)
exports.updateBookingWithPayment = async (req, res) => {
  try {
    console.log(`💰 Updating booking ${req.params.id} with payment`);
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update booking
    booking.status = 'confirmed';
    booking.paymentId = req.body.paymentId;
    booking.paymentDate = new Date();
    booking.paymentAmount = req.body.amount;
    
    await booking.save();
    
    console.log(`✅ Booking ${booking._id} updated with payment ${req.body.paymentId}`);
    res.json(booking);
    
  } catch (error) {
    console.error(`❌ Error updating booking:`, error.message);
    res.status(500).json({ message: error.message });
  }
};