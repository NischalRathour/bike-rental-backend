const express = require("express");
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  verifyOTP, 
  resendOTP 
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// ============================================================
// 🚨 TEMPORARY SETUP ROUTE (Delete after admin@example.com is created)
// Visit: http://localhost:5000/api/users/setup-admin
// ============================================================
router.get('/setup-admin', async (req, res) => {
  try {
    // Check if this admin already exists in your MongoDB Cluster
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (adminExists) return res.send("Admin node already exists in Cluster. You can now login.");

    // This creates the user and triggers Bcrypt hashing automatically
    await User.create({
      name: "Master Admin",
      email: "admin@example.com", 
      password: "AdminPassword123", // Use this password to login
      role: "admin",
      isVerified: true
    });

    res.send("🚀 Success! admin@example.com created in your MongoDB Cluster. Go to /admin-login now.");
  } catch (err) {
    res.status(500).send("System Error: " + err.message);
  }
});

// ============================================================
// 🔓 PUBLIC ROUTES
// ============================================================
router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);
router.post("/resend-otp", resendOTP);

// ============================================================
// 🔒 PROTECTED ROUTES
// ============================================================
router.get("/me", protect, getMe);

router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      
      // If password is provided, model middleware will hash it on .save()
      if (req.body.password) user.password = req.body.password;

      const updatedUser = await user.save();
      
      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;