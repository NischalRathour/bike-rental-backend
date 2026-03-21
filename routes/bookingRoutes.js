const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  getBookingById,
  updateBookingWithPayment
} = require("../controllers/bookingController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// --- CUSTOMER ---
router.get("/my", protect, getMyBookings);
router.post("/", protect, createBooking);
router.get("/:id", protect, getBookingById);
router.put("/:id/pay", protect, updateBookingWithPayment);

// --- ADMIN ---
router.get("/admin/all", protect, allowRoles("admin"), getAllBookings);
router.put("/admin/:id", protect, allowRoles("admin"), updateBookingStatus);

module.exports = router;