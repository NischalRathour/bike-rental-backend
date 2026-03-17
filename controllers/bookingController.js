const Booking = require("../models/Booking");

// ✅ 1. View own bookings
exports.getMyBookings = async (req, res) => {
  try {
    // We don't populate "bike" here because your bikes might be static strings "b1"
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ 2. Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { bikeId, startDate, endDate, totalPrice, days } = req.body;

    const booking = new Booking({
      user: req.user._id,
      bike: bikeId, // ✅ Accepts "b1", "b2" etc as Strings
      startDate,
      endDate,
      totalPrice,
      days,
      status: 'Pending',
      paymentStatus: 'Unpaid'
    });

    const savedBooking = await booking.save();
    res.status(201).json({ success: true, booking: savedBooking });
  } catch (error) {
    console.error("Booking Creation Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ 3. Update booking with payment
exports.updateBookingWithPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    booking.status = 'Confirmed'; 
    booking.paymentStatus = 'Paid'; 
    booking.paymentId = req.body.paymentId;
    booking.paymentDate = new Date();
    booking.paymentAmount = req.body.amount || booking.totalPrice;
    
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
      .populate("user", "name email");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const isOwner = booking.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error retrieving booking" });
  }
};

// ✅ 5. Admin: View all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
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