const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/** 🔐 ADMIN LOGIN: IDENTITY VERIFICATION */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user and explicitly pull the password field
    const user = await User.findOne({ email }).select('+password');

    // 2. Strict Role Check: Must exist and must be an 'admin' node
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Access Denied: Administrative privileges required.' 
      });
    }

    // 3. Decrypt and Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Credentials. Authentication failed.' 
      });
    }

    // 4. Generate JWT Node Telemetry (Token)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    // 5. Success Response
    res.status(200).json({ 
      success: true, 
      token, 
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email,
        role: user.role 
      },
      message: "Admin session initiated successfully."
    });

  } catch (error) {
    console.error("❌ Admin Auth Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Intelligence Error" });
  }
};

/** 🔓 ADMIN LOGOUT: SESSION TERMINATION */
exports.adminLogout = async (req, res) => {
  // Since JWT is stateless, frontend handles token deletion. 
  // We just confirm the termination on the server side.
  res.status(200).json({ 
    success: true, 
    message: 'Admin session terminated. Identity node cleared.' 
  });
};

/** 📡 SESSION SYNC: CHECK ADMIN STATUS */
exports.checkAdminSession = async (req, res) => {
  try {
    // req.user is populated by your 'protect' middleware
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Invalid Admin Session" });
    }

    res.status(200).json({ 
      success: true, 
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        email: req.user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Session Sync Failed" });
  }
};