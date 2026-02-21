const express = require('express');
const router = express.Router();
const { adminLogin, checkAdminSession } = require('../controllers/adminAuthController');

// 🛡️ DOUBLE-CHECK THESE NAMES match the exports in adminController.js
const { 
  getDashboardStats, 
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

router.get('/check-session', checkAdminSession);
router.get('/dashboard', getDashboardStats);
router.get('/report', generateReportData); // 🚨 CHECK THIS LINE (Line 23 area)

// Bike Management
router.post('/bikes', addBikeAdmin);
router.put('/bikes/:id', updateBikeAdmin);
router.delete('/bikes/:id', deleteBikeAdmin);

// Booking Management
router.put('/bookings/:id/status', updateBookingStatusAdmin);
router.delete('/bookings/:id', deleteBookingAdmin);

module.exports = router;