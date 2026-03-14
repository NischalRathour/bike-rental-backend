const express = require('express');
const router = express.Router();

const { 
  adminLogin, 
  adminLogout, 
  checkAdminSession 
} = require('../controllers/adminAuthController');

const { 
  getDashboardStats, 
  getAllUsers, 
  deleteUserAdmin,
  getAllBookingsAdmin, // ✅ Added for the list view
  updateBookingStatusAdmin, 
  deleteBookingAdmin, 
  addBikeAdmin, 
  updateBikeAdmin, 
  deleteBikeAdmin, 
  generateReportData 
} = require('../controllers/adminController'); 

const { protect, allowRoles } = require('../middleware/authMiddleware');

router.post('/login', adminLogin);

router.use(protect, allowRoles('admin'));

// --- IDENTITY ---
router.get('/check-session', checkAdminSession);
router.post('/logout', adminLogout);
router.get('/users', getAllUsers); 
router.delete('/users/:id', deleteUserAdmin);

// --- ANALYTICS ---
router.get('/dashboard', getDashboardStats);
router.get('/report', generateReportData); 

// --- FLEET ---
router.post('/bikes', addBikeAdmin);
router.put('/bikes/:id', updateBikeAdmin);
router.delete('/bikes/:id', deleteBikeAdmin);

// --- BOOKING OPERATIONS (APPROVED & CANCEL) ---
router.get('/bookings', getAllBookingsAdmin); // ✅ Added: Get all bookings for admin
router.put('/bookings/:id/status', updateBookingStatusAdmin); 
router.delete('/bookings/:id', deleteBookingAdmin); 

module.exports = router;