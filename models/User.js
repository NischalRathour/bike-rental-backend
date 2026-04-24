const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    role: { type: String, enum: ["customer", "owner", "admin"], default: "customer" },
    isVerified: { type: Boolean, default: false },
    
    // 🏦 FINTECH SUBSYSTEM: Virtual Wallet
    // Without this, the paymentController won't find a 'balance' to deduct from
    balance: { 
      type: Number, 
      default: 50000 // Rs. 50,000 starting credit for new users
    },

    // Standard Verification (Login/Register)
    otpCode: { type: String },
    otpExpires: { type: Date },
    
    // Password Reset Specific
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    
    // Profile Management Details
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    // ✅ GREEN IT TELEMETRY (For Dashboard)
    rewardPoints: { type: Number, default: 0 },
    co2Saved: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/**
 * 🛡️ ENCRYPTION ENGINE
 * Automatically hashes the password before saving to the DB
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * 🔑 AUTHENTICATION HELPER
 * Required for the Login process to verify the user's password
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);