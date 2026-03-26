const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/** 🔐 ADMIN LOGIN: DIRECT ACCESS (NO OTP) */
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user and explicitly pull the password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        // 2. Strict Role Check
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access Denied: Administrative Node not found.' 
            });
        }

        // 3. Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid Credentials.' 
            });
        }

        // 4. ✅ SUCCESS: Generate token immediately
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' }
        );

        res.status(200).json({ 
            success: true, 
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'admin'
            },
            message: "Administrative authentication successful."
        });

    } catch (error) {
        console.error("❌ Admin Auth Error:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/** 🔓 ADMIN LOGOUT */
exports.adminLogout = async (req, res) => {
    res.status(200).json({ success: true, message: 'Admin session terminated.' });
};

/** 📡 SESSION SYNC */
exports.checkAdminSession = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Invalid Admin Session" });
        }
        res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Session Sync Failed" });
    }
};