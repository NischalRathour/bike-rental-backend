const Booking = require("../models/Booking");

// ✅ 1. View own bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("bike", "name price image")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ 2. Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      user: req.user._id,
      status: 'Pending'
    });

    const savedBooking = await booking.save();
    res.status(201).json({ success: true, booking: savedBooking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ 3. Update booking with payment
exports.updateBookingWithPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // String conversion for comparison
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    booking.status = 'Confirmed'; 
    booking.paymentStatus = 'Paid'; 
    booking.paymentId = req.body.paymentId;
    booking.paymentDate = new Date();
    booking.paymentAmount = req.body.amount;
    
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ 4. Get specific booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("bike", "name price image")
      .populate("user", "name email");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const isOwner = booking.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized access to record" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ 5. Admin: View all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("bike", "name price")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ 6. Admin: Update status
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