const express = require("express");
const router = express.Router();

/**
 * ✅ IMPORTANT: These names must match the 'exports.name' 
 * exactly as they appear in userController.js
 */
const { 
  registerUser, 
  loginUser, 
  getMe, 
  verifyOTP, 
  resendOTP,
  forgotPassword,
  resetPassword 
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// ============================================================
// 🚨 EMERGENCY ADMIN SETUP
// ============================================================
/**
 * Visit: http://localhost:5000/api/users/setup-admin
 * Use this only once to create your master admin account.
 */
router.get('/setup-admin', async (req, res) => {
  try {
    const adminEmail = "admin@example.com";
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      return res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #6366f1;">Vault Secure</h2>
          <p>Admin account <strong>${adminEmail}</strong> already exists.</p>
          <a href="http://localhost:3000/admin-login" style="color: #6366f1;">Go to Login</a>
        </div>
      `);
    }

    // Creating Admin with direct password (pre-save hook will hash it)
    await User.create({
      name: "Master Admin",
      email: adminEmail, 
      password: "AdminPassword123", 
      role: "admin",
      isVerified: true
    });

    res.status(201).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #10b981;">🚀 Deployment Successful</h2>
        <p>Master Admin created: <strong>${adminEmail}</strong></p>
        <p>Password: <strong>AdminPassword123</strong></p>
        <p style="color: #64748b;">You can now log in at the admin portal.</p>
      </div>
    `);
  } catch (err) {
    res.status(500).json({ success: false, message: "System Error: " + err.message });
  }
});

// ============================================================
// 🔓 PUBLIC AUTHENTICATION ROUTES
// ============================================================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ============================================================
// 🔒 PROTECTED USER ROUTES (Token Required)
// ============================================================
router.get("/me", protect, getMe);

/**
 * Update Profile Logic
 * Handles name, phone, address, and password updates
 */
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update dynamic fields
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    
    // If a new password is provided, assign it (User.js hashes it on .save())
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address
      }
    });
  } catch (err) {
    console.error("Profile Update Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

module.exports = router;