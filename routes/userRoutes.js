const express = require("express");
const router = express.Router();

/**
 * ✅ FULLY SYNCHRONIZED CONTROLLERS
 * Unified pipeline for standard credentials and federated third-party identity providers.
 */
const { 
  registerUser, 
  loginUser, 
  googleLogin, // 📡 Secure Google OAuth Controller Link
  getMe, 
  verifyOTP, 
  resendOTP,
  forgotPassword,
  resetPassword,
  updateUserProfile 
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware"); 
const User = require("../models/User");

// ============================================================
// 🚨 EMERGENCY ADMIN SETUP
// ============================================================
router.get('/setup-admin', async (req, res) => {
  try {
    const adminEmail = "admin@example.com";
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      return res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 100px; background: #0f172a; color: white; height: 100vh; margin: 0;">
          <h1 style="color: #6366f1; font-size: 3rem;">VAULT SECURE</h1>
          <p style="font-size: 1.2rem; color: #94a3b8;">The Master Admin account <strong>${adminEmail}</strong> is already active.</p>
          <div style="margin-top: 30px;">
            <a href="http://localhost:3000/admin-login" style="color: white; text-decoration: none; background: #6366f1; padding: 12px 30px; border-radius: 8px; font-weight: bold;">Enter Admin Portal</a>
          </div>
        </div>
      `);
    }

    await User.create({
      name: "Master Admin",
      email: adminEmail, 
      password: "AdminPassword123", 
      role: "admin",
      isVerified: true
    });

    res.status(201).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 100px; background: #0f172a; color: white; height: 100vh; margin: 0;">
        <h1 style="color: #10b981; font-size: 3rem;">SYSTEM DEPLOYED</h1>
        <p style="font-size: 1.2rem;">Master Admin created: <strong style="color: #10b981;">${adminEmail}</strong></p>
        <p style="font-size: 1.2rem;">Temporary Password: <strong style="color: #f59e0b;">AdminPassword123</strong></p>
      </div>
    `);
  } catch (err) {
    res.status(500).json({ success: false, message: "Critical System Error: " + err.message });
  }
});

// ============================================================
// 🔓 PUBLIC AUTHENTICATION ROUTES
// ============================================================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin); // 🚀 SECURE THIRD-PARTY AUTH OVERLAY
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ============================================================
// 🔒 PROTECTED USER ROUTES
// ============================================================

/**
 * @route   GET /api/users/me
 * @desc    Fetch active operator profile metadata
 * @access  Private
 */
router.get("/me", protect, getMe);

/**
 * @route   PUT /api/users/profile
 * @desc    Update profile information (synchronizes name, phone, address, and balances)
 * @access  Private (Restricted via roleMiddleware check)
 */
router.put(
  "/profile", 
  protect, 
  allowRoles("customer", "owner", "admin"), 
  updateUserProfile
);

module.exports = router;