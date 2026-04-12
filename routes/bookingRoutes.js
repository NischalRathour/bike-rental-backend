const express = require("express");
const router = express.Router();

/**
 * ✅ BOOKING SYSTEM ROUTER
 * Logic: Handles both Bike Rentals and Tour Expeditions.
 * Security: All routes are 'protected' (require a valid JWT).
 */
const {
  createBooking,
  createTourBooking, // ⬅️ New Tour logic integrated
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBookingWithPayment,
  updateBookingStatus
} = require("../controllers/bookingController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// ============================================================
// 🔒 CUSTOMER ROUTES (Requires Login)
// ============================================================

/**
 * @route   GET /api/bookings/my
 * @desc    Get logged-in user's rental and tour history
 */
router.get("/my", protect, getMyBookings);

/**
 * @route   POST /api/bookings/
 * @desc    Create a new Bike Rental booking
 */
router.post("/", protect, createBooking);

/**
 * @route   POST /api/bookings/create-tour-booking
 * @desc    Create a new Tour Expedition booking (Redirects to Stripe)
 */
router.post("/create-tour-booking", protect, createTourBooking);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get full details of a specific booking (Bikes or Tours)
 */
router.get("/:id", protect, getBookingById);

/**
 * @route   PUT /api/bookings/:id/pay
 * @desc    Update payment status to 'Paid' after successful Stripe checkout
 */
router.put("/:id/pay", protect, updateBookingWithPayment);


// ============================================================
// 👑 ADMIN ROUTES (Requires Admin Role)
// ============================================================

/**
 * @route   GET /api/bookings/admin/all
 * @desc    Global fleet overview for the admin dashboard
 */
router.get("/admin/all", protect, allowRoles("admin"), getAllBookings);

/**
 * @route   PUT /api/bookings/admin/:id
 * @desc    Manually update booking status (e.g., Pending -> Completed)
 */
router.put("/admin/:id", protect, allowRoles("admin"), updateBookingStatus);

module.exports = router;