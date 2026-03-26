const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

/**
 * 🛰️ TOKEN GENERATOR
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/**
 * 🛡️ SECURITY HELPER: Generate and Send OTP
 */
const sendSecurityOTP = async (user, type = "Verification") => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  await User.findByIdAndUpdate(user._id, {
    otpCode: otp,
    otpExpires: Date.now() + 10 * 60 * 1000, // 10 mins
  });

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px;">
      <h2 style="color: #6366f1; text-align: center;">RIDE N ROAR SECURITY</h2>
      <p>Namaste <strong>${user.name}</strong>,</p>
      <p>Your <strong>${type}</strong> code is: <br/> 
        <span style="font-size: 32px; font-weight: 800; color: #1e293b; background: #f1f5f9; padding: 5px 15px; border-radius: 8px;">${otp}</span>
      </p>
    </div>
  `;

  await sendEmail({ 
    email: user.email, 
    subject: `${type} Code - Ride N Roar`, 
    message: htmlMessage 
  });
};

// ================= 📝 REGISTER =================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email: email.toLowerCase() });
    
    if (userExists) return res.status(400).json({ message: "User already registered" });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "customer",
      isVerified: false
    });

    try {
      await sendSecurityOTP(user, "Account Activation");
      res.status(201).json({ success: true, message: "OTP sent to Gmail" });
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: "Email service failed." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= 🔑 LOGIN (FIXED FOR ADMIN DIRECT ACCESS) =================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 🛡️ CASE 1: ADMIN LOGIN (Direct Access - No OTP)
    if (user.role === 'admin') {
      return res.status(200).json({
        success: true,
        token: generateToken(user._id, user.role),
        user: { 
          _id: user._id, 
          name: user.name, 
          role: user.role, 
          email: user.email,
          isVerified: true
        }
      });
    }

    // 👤 CASE 2: CUSTOMER LOGIN (Requires OTP)
    if (user.isVerified) {
      await sendSecurityOTP(user, "Login Verification");
      return res.json({ 
        success: true, 
        requiresOTP: true, 
        email: user.email 
      });
    }
    
    return res.status(401).json({ 
      message: "Verify your email first", 
      needsVerification: true, 
      email: user.email 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ✅ VERIFY OTP =================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, {
        isVerified: true,
        $unset: { otpCode: 1, otpExpires: 1 } 
    }, { new: true });

    res.status(200).json({
      success: true,
      token: generateToken(updatedUser._id, updatedUser.role),
      user: { 
        _id: updatedUser._id, 
        name: updatedUser.name, 
        role: updatedUser.role, 
        email: updatedUser.email,
        isVerified: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= 🔄 RESEND OTP =================
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    await sendSecurityOTP(user, "New Security");
    res.json({ success: true, message: "New OTP sent to Gmail" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= 📡 GET ME =================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};