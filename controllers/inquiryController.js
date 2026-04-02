const Inquiry = require("../models/Inquiry");

// @desc    Create new inquiry (Works for both Contact Form & Tours)
// @route   POST /api/tours/inquiry OR POST /api/contact/inquiry
exports.createInquiry = async (req, res) => {
  try {
    const { fullName, tourName, groupSize } = req.body;

    // Validation
    if (!fullName || !tourName) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide your full name and the subject/tour name." 
      });
    }

    // Save to Database
    const inquiry = await Inquiry.create({
      fullName,
      tourName,
      groupSize
    });

    res.status(201).json({
      success: true,
      message: "Inquiry sent successfully! Our team will contact you soon.",
      data: inquiry
    });
  } catch (error) {
    console.error("Inquiry Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: Could not process inquiry at this time." 
    });
  }
};

// @desc    Get all inquiries (For Admin Dashboard)
// @route   GET /api/tours/inquiries
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};