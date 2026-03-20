const express = require('express');
const router = express.Router();

// Import all required controllers
const { 
  adminLogin, 
  adminLogout, 
  checkAdminSession 
} = require('../controllers/adminAuthController');

const { 
  getDashboardStats, 
  getAllUsers, 
  deleteUserAdmin, 
  getAllBookingsAdmin, 
  updateBookingStatusAdmin, 
  deleteBookingAdmin, 
  addBikeAdmin, 
  updateBikeAdmin, 
  deleteBikeAdmin, 
  updateBikeStatusAdmin,
  generateReportData 
} = require('../controllers/adminController'); 

const { protect, allowRoles } = require('../middleware/authMiddleware');

// 1. Public Admin Routes
router.post('/login', adminLogin);

// 2. Protected Admin Routes
router.use(protect, allowRoles('admin'));

// --- OPERATIONS INTELLIGENCE (FIXED ENDPOINT) ---
// This handles the call to /api/admin/insights
router.get('/insights', getDashboardStats); 

// --- IDENTITY & SESSION ---
router.get('/check-session', checkAdminSession);
router.post('/logout', adminLogout);
router.get('/users', getAllUsers); 
router.delete('/users/:id', deleteUserAdmin);

// --- FLEET MANAGEMENT ---
router.post('/bikes', addBikeAdmin);
router.put('/bikes/:id', updateBikeAdmin);
router.patch('/bikes/:id/status', updateBikeStatusAdmin);
router.delete('/bikes/:id', deleteBikeAdmin);

// --- GLOBAL BOOKING LEDGER ---
router.get('/bookings', getAllBookingsAdmin);
router.put('/bookings/:id/status', updateBookingStatusAdmin); 
router.delete('/bookings/:id', deleteBookingAdmin); 
router.get('/report', generateReportData);

module.exports = router;