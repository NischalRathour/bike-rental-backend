const express = require('express');
const router = express.Router();

/**
 * 🛠️ CONTROLLER IMPORTS
 * Logic for Authentication and System Management
 */
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

// 🛡️ MIDDLEWARE IMPORTS
const { protect, allowRoles } = require('../middleware/authMiddleware');

/**
 * 🔓 PUBLIC ADMIN ROUTES
 * Only the login route is accessible without a token.
 */
router.post('/login', adminLogin);

/**
 * 🔒 PROTECTED ADMIN ROUTES (SHIELDED)
 * Every route below this line is locked behind 'protect' and 'allowRoles'.
 */
router.use(protect, allowRoles('admin'));

// 📊 DASHBOARD & SESSION INTELLIGENCE
router.get('/insights', getDashboardStats); 
router.get('/check-session', checkAdminSession);
router.post('/logout', adminLogout);

// 👤 USER MANAGEMENT (IDENTITY DIRECTORY)
router.get('/users', getAllUsers); 
router.delete('/users/:id', deleteUserAdmin);

// 🏍️ FLEET (BIKE) MANAGEMENT
router.post('/bikes', addBikeAdmin);
router.put('/bikes/:id', updateBikeAdmin);
router.patch('/bikes/:id/status', updateBikeStatusAdmin);
router.delete('/bikes/:id', deleteBikeAdmin);

// 📋 BOOKING OPERATIONS & REPORTING
router.get('/bookings', getAllBookingsAdmin);
router.put('/bookings/:id/status', updateBookingStatusAdmin); 
router.delete('/bookings/:id', deleteBookingAdmin); 
router.get('/report', generateReportData);

module.exports = router;