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
      .populate("bike", "name price");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: view all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("bike", "name price");
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
