const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  getBookingById,           // ✅ New
  updateBookingWithPayment  // ✅ New
} = require("../controllers/bookingController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// CUSTOMER
router.post("/", protect, allowRoles("customer"), createBooking);
router.get("/my", protect, allowRoles("customer"), getMyBookings);

// ✅ Get specific booking (for payment page)
router.get("/:id", protect, allowRoles("customer", "admin"), getBookingById);

// ✅ Update booking with payment (for payment success)
router.put("/:id/pay", protect, allowRoles("customer"), updateBookingWithPayment);

// ADMIN
router.get("/", protect, allowRoles("admin"), getAllBookings);
router.put("/:id", protect, allowRoles("admin"), updateBookingStatus);

module.exports = router;