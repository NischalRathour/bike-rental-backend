const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

// Instantiate the official Google OAuth Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * 🛰️ TOKEN GENERATOR
 * Encrypts user identification metadata into a 30-day session token string
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/**
 * 🛡️ SECURITY HELPER: OTP Dispatch
 * Handles out-of-band numeric token generation and multi-tier email styling rules
 */
const sendSecurityOTP = async (user, type = "Verification") => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  if (type === "Password Reset") {
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  } else {
    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
  }
  
  await user.save();

  const htmlMessage = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px;">
      <h2 style="color: #6366f1; text-align: center;">RIDE N ROAR SECURITY</h2>
      <p>Namaste <strong>${user.name}</strong>,</p>
      <p>Your <strong>${type}</strong> security code is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: 800; color: #1e293b; background: #f1f5f9; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center;">Valid for 10 minutes.</p>
    </div>
  `;

  await sendEmail({ 
    email: user.email, 
    subject: `${type} Code - Ride N Roar`, 
    message: htmlMessage,
    role: user.role 
  });
};

// --- 📝 REGISTER ---
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) return res.status(400).json({ message: "User already registered" });

    const user = await User.create({ 
      name: name.trim(), 
      email: cleanEmail, 
      password, 
      role: role || "customer",
      balance: 50000 // Rs. 50,000 baseline fintech credits allocated upfront
    });
    
    await sendSecurityOTP(user, "Account Activation");
    res.status(201).json({ success: true, message: "Verification code sent to Gmail" });
  } catch (error) { 
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: error.message }); 
  }
};

// --- 🔑 LOGIN ---
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified && user.role !== 'admin') {
      return res.status(401).json({ 
        message: "Account not active. Please verify your email.", 
        needsVerification: true, 
        email: user.email 
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { 
        _id: user._id, 
        name: user.name, 
        role: user.role, 
        email: user.email, 
        balance: user.balance,
        phone: user.phone, 
        address: user.address, 
        rewardPoints: user.rewardPoints, 
        co2Saved: user.co2Saved 
      }
    });
  } catch (error) { 
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" }); 
  }
};

// --- 🛡️ THIRD-PARTY IDENTITY FEDERATION GATEWAY (GOOGLE SIGN-IN) ---
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "OAuth credential payload missing." });
    }

    // 1. Verify token cryptographic signature against Google public keys
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    // 2. Extract verified assertions from the payload
    const { email, name } = ticket.getPayload();
    const cleanEmail = email.toLowerCase().trim();

    // 3. Search system ecosystem for matching identity document
    let user = await User.findOne({ email: cleanEmail });

    // 4. Just-In-Time Provisioning if it's a first-time single sign-on event
    if (!user) {
      user = await User.create({
        name: name,
        email: cleanEmail,
        password: Math.random().toString(36).slice(-12), // Set an arbitrary random passhash string
        role: "customer",
        balance: 50000,   // Match virtual fintech baseline card balance
        isVerified: true  // Identity is pre-validated by Google
      });
    }

    // 5. Build Response Object explicitly reflecting database configurations (Crucial for Multiple Owner Defense)
    res.status(200).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        role: user.role, // 🚀 DYNAMIC: Returns the actual updated database role ('owner'/'admin'/'customer')
        email: user.email,
        balance: user.balance,
        phone: user.phone,
        address: user.address,
        rewardPoints: user.rewardPoints,
        co2Saved: user.co2Saved
      }
    });

  } catch (error) {
    console.error("Google Auth Gateway Protocol Error:", error.message);
    res.status(400).json({ success: false, message: "OAuth cryptographic identity validation failed." });
  }
};

// --- 🛠️ UPDATE PROFILE ---
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      user: { 
        _id: updatedUser._id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        role: updatedUser.role, 
        balance: updatedUser.balance,
        phone: updatedUser.phone, 
        address: updatedUser.address, 
        rewardPoints: updatedUser.rewardPoints, 
        co2Saved: updatedUser.co2Saved 
      }
    });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message }); 
  }
};

// --- ✅ VERIFY OTP ---
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = (user.otpCode === otp.trim() || user.resetPasswordOTP === otp.trim());
    const isNotExpired = (user.otpExpires > Date.now() || user.resetPasswordExpires > Date.now());

    if (!isValid || !isNotExpired) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ 
      success: true, 
      token: generateToken(user._id, user.role), 
      user: { 
        _id: user._id, 
        name: user.name, 
        role: user.role, 
        email: user.email,
        balance: user.balance
      } 
    });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// --- 🔑 FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) return res.status(404).json({ message: "User not found" });

    await sendSecurityOTP(user, "Password Reset");
    res.status(200).json({ success: true, message: "Reset code sent to Gmail" });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// --- 🔑 RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      resetPasswordOTP: otp.toString().trim(),
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset code" });

    user.password = newPassword; 
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// --- 🔄 RESEND OTP ---
exports.resendOTP = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    await sendSecurityOTP(user, "New Code Request");
    res.status(200).json({ success: true, message: "New OTP sent" });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// --- 👤 GET CURRENT USER DATA ---
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};