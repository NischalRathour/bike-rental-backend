const Booking = require("../models/Booking");
const Bike = require("../models/Bike");

// ✅ 1. CREATE BOOKING (Solo or Group)
exports.createBooking = async (req, res) => {
  try {
    const { bikeIds, startDate, endDate, totalPrice } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

    const co2 = (bikeIds.length * days * 2.4).toFixed(1); 
    const points = (bikeIds.length * 50) + (days * 10);

    const booking = new Booking({
      user: req.user._id,
      bikes: bikeIds, 
      startDate,
      endDate,
      totalPrice,
      days,
      bookingType: bikeIds.length > 1 ? 'Group' : 'Solo',
      co2Saved: co2,
      rewardPoints: points
    });

    const savedBooking = await booking.save();
    await Bike.updateMany({ _id: { $in: bikeIds } }, { status: 'Rented' });

    res.status(201).json({ success: true, booking: savedBooking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ 2. GET MY BOOKINGS
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("bikes")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ 3. GET SINGLE BOOKING BY ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("bikes");
    if (!booking) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ 4. UPDATE PAYMENT
exports.updateBookingWithPayment = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status: 'Confirmed', paymentStatus: 'Paid', paymentId: req.body.paymentId },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ 5. ADMIN: GET ALL
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user", "name").populate("bikes");
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ 6. ADMIN: UPDATE STATUS
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