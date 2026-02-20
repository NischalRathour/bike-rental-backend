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

// 1. Create a new booking
router.post("/", protect, allowRoles("customer"), createBooking);

// 2. View logged-in customer's bookings 
// ✅ CRITICAL: This MUST stay above /:id to avoid route conflicts
router.get("/my", protect, allowRoles("customer"), getMyBookings);

// 3. Process payment for a booking
router.put("/:id/pay", protect, allowRoles("customer"), updateBookingWithPayment);

// 4. Get details of a single booking (Used by Customer Payment & Admin view)
router.get("/:id", protect, allowRoles("customer", "admin"), getBookingById);

// 5. Admin: View all bookings in the system
router.get("/", protect, allowRoles("admin"), getAllBookings);

// 6. Admin: Manually update booking status
router.put("/:id", protect, allowRoles("admin"), updateBookingStatus);

module.exports = router;