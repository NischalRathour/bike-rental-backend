const express = require('express');
const router = express.Router();
const { getTours, createTour } = require('../controllers/tourController');
const { createInquiry } = require('../controllers/inquiryController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// Public: Everyone can see tours and send inquiries
router.get('/', getTours);
router.post('/inquiry', createInquiry);

// Admin Only: To add new tours via Postman
router.post('/', protect, allowRoles('admin'), createTour);

module.exports = router;