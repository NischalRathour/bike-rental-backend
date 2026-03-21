const express = require('express');
const router = express.Router();

// 1. Import Auth Controllers
const { 
  adminLogin, 
  adminLogout, 
  checkAdminSession 
} = require('../controllers/adminAuthController');

// 2. Import Admin Operations (Ensure path is correct)
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

// --- PUBLIC ROUTES ---
router.post('/login', adminLogin);

// --- PROTECTED ROUTES (Admin Only) ---
router.use(protect, allowRoles('admin'));

// 📊 DASHBOARD & SESSION
router.get('/insights', getDashboardStats); 
router.get('/check-session', checkAdminSession);
router.post('/logout', adminLogout);

// 👤 USER MANAGEMENT
router.get('/users', getAllUsers); 
router.delete('/users/:id', deleteUserAdmin);

// 🏍️ FLEET MANAGEMENT
router.post('/bikes', addBikeAdmin);
router.put('/bikes/:id', updateBikeAdmin);
router.patch('/bikes/:id/status', updateBikeStatusAdmin);
router.delete('/bikes/:id', deleteBikeAdmin);

// 📋 BOOKING MANAGEMENT & REPORTS
router.get('/bookings', getAllBookingsAdmin);
router.put('/bookings/:id/status', updateBookingStatusAdmin); 
router.delete('/bookings/:id', deleteBookingAdmin); 
router.get('/report', generateReportData);

module.exports = router;