const express = require("express");
const { registerUser, loginUser, getMe } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User"); // ✅ Added import for Profile Update logic

const router = express.Router();

// --- AUTHENTICATION ---
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe); 

// --- PROFILE MANAGEMENT (FDD STEP 4) ---
// ✅ This route handles the Profile.jsx form submission
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update fields if provided, otherwise keep existing
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      
      // If you want to allow password changes here too:
      if (req.body.password) {
        user.password = req.body.password; // Middleware in User model will hash this
      }

      const updatedUser = await user.save();

      res.json({ 
        success: true, 
        message: "Profile synchronized with Kathmandu Fleet Database",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: updatedUser.address,
          role: updatedUser.role
        } 
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("❌ Profile Update Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;