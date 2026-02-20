const express = require('express');
const router = express.Router();
const { adminLogin, adminLogout, checkAdminSession } = require('../controllers/adminAuthController');
const { getDashboardStats, updateBookingStatusAdmin } = require('../controllers/adminController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// 🟢 PUBLIC: Admin Login
router.post('/login', adminLogin);

// 🔴 PROTECTED: Requires valid JWT and admin role
router.use(protect, allowRoles('admin'));

router.get('/check-session', checkAdminSession);
router.get('/dashboard', getDashboardStats);
router.put('/bookings/:id/status', updateBookingStatusAdmin);

module.exports = router;