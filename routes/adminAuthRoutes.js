const express = require('express');
const router = express.Router();

// Import controller functions
const adminAuthController = require('../controllers/adminAuthController');

// Import middleware
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/login', adminAuthController.adminLogin);
router.get('/logout', adminAuthController.adminLogout);

// Protected routes - requires valid admin token
router.get('/check-session', 
  authMiddleware.protect, 
  authMiddleware.allowRoles('admin'), 
  adminAuthController.checkAdminSession
);

// Export router
module.exports = router;