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

// --- CUSTOMER ROUTES ---

// 1. Create a booking
router.post("/", protect, allowRoles("customer"), createBooking);

// 2. View own bookings 
// ✅ FIXED: Moved ABOVE /:id so Express doesn't confuse "my" with an ID
router.get("/my", protect, allowRoles("customer"), getMyBookings);

// 3. Update specific booking with payment
router.put("/:id/pay", protect, allowRoles("customer"), updateBookingWithPayment);

// --- SHARED/ADMIN ROUTES ---

// 4. Get specific booking (Used by Payment Page)
router.get("/:id", protect, allowRoles("customer", "admin"), getBookingById);

// 5. Admin: view all
router.get("/", protect, allowRoles("admin"), getAllBookings);

// 6. Admin: update status manually
router.put("/:id", protect, allowRoles("admin"), updateBookingStatus);

module.exports = router;