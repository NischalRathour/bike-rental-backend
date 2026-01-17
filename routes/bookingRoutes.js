const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus
} = require("../controllers/bookingController");

const { protect, allowRoles } = require("../middleware/authMiddleware"); // ✅ corrected

// CUSTOMER
router.post("/", protect, allowRoles("customer"), createBooking);
router.get("/my", protect, allowRoles("customer"), getMyBookings);

// ADMIN
router.get("/", protect, allowRoles("admin"), getAllBookings);
router.put("/:id", protect, allowRoles("admin"), updateBookingStatus);

module.exports = router;
