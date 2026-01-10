const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");

// POST – Create a new booking
router.post("/", createBooking);

// GET – View all bookings
router.get("/", getBookings);

// PUT – Update booking/payment status
router.put("/:id", updateBookingStatus);

module.exports = router;
