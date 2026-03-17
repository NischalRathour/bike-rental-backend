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

/* ================= CUSTOMER ROUTES ================= */

// 1. View logged-in customer's bookings (MUST be above /:id)
router.get("/my", protect, allowRoles("customer"), getMyBookings);

// 2. Create a new booking
router.post("/", protect, allowRoles("customer"), createBooking);

// 3. Get details of a single booking (Used for Payment Page)
router.get("/:id", protect, allowRoles("customer", "admin"), getBookingById);

// 4. Process payment for a booking
router.put("/:id/pay", protect, allowRoles("customer"), updateBookingWithPayment);


/* ================= ADMIN ROUTES ================= */

// 5. Admin: View all bookings in the system
router.get("/admin/all", protect, allowRoles("admin"), getAllBookings);

// 6. Admin: Manually update booking status
router.put("/admin/:id", protect, allowRoles("admin"), updateBookingStatus);

module.exports = router;