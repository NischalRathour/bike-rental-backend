const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Admin login attempt:', { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('👤 User found:', user.email, 'Role:', user.role);

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('❌ Not an admin user:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Check password
    let isPasswordValid = false;
    
    // Check if user has comparePassword method
    if (typeof user.comparePassword === 'function') {
      isPasswordValid = await user.comparePassword(password);
    } else {
      // Fallback: direct bcrypt compare
      isPasswordValid = await bcrypt.compare(password, user.password);
    }
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('✅ Admin login successful:', user.email);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Admin logout
const adminLogout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check admin session
const checkAdminSession = async (req, res) => {
  try {
    console.log('🔍 Checking admin session for:', req.user.email);
    
    res.status(200).json({
      success: true,
      user: req.user,
      message: 'Session valid'
    });
  } catch (error) {
    console.error('❌ Check session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export functions
module.exports = {
  adminLogin,
  adminLogout,
  checkAdminSession
};