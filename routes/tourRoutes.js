const express = require("express");
const router = express.Router();
const { createInquiry, getAllInquiries } = require("../controllers/inquiryController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// @route   POST /api/tours/inquiry
// This is the public route your frontend "Inquire Now" button hits
router.post("/inquiry", createInquiry);

// @route   GET /api/tours/inquiries
// This is for you (Admin) to see who wants a tour
router.get("/inquiries", protect, allowRoles("admin"), getAllInquiries);

module.exports = router;