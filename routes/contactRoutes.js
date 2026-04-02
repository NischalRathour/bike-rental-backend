const express = require('express');
const router = express.Router();
const { createInquiry } = require('../controllers/inquiryController');

/**
 * @route   POST /api/contact/inquiry
 * @desc    Handle messages from the Contact Us page
 * @access  Public
 */
router.post('/inquiry', createInquiry);

module.exports = router;