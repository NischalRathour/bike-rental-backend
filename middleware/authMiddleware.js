const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * ✅ 1. THE PROTECTOR (Authentication Middleware)
 * Logic: Verifies who the user is using the incoming Bearer JWT and attaches the 
 * complete user document (including balance, metadata) to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in incoming request headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token by splitting the "Bearer <token>" string
      token = req.headers.authorization.split(" ")[1];

      // Verify token authenticity using the cryptographic secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database and append to request lifecycle (excluding password hash)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "User not found in system." });
      }

      return next(); // Safe handshake pass to next execution gate
    } catch (error) {
      console.error(`🚨 Auth Error: ${error.message}`);
      return res.status(401).json({ success: false, message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided." });
  }
};

/**
 * ✅ 2. THE GATEKEEPER (Dynamic Role Authorization)
 * Logic: Verifies if the user's role (customer, owner, admin) matches required endpoint permissions.
 * Supports case-insensitive matching by normalizing values automatically.
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user object exists (this guard relies on 'protect' middleware running first)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please log in." 
      });
    }

    // Normalize user role and authorized list to lowercase to prevent casing bugs during evaluation
    const userRole = req.user.role?.toLowerCase();
    const authorizedRoles = roles.map(r => r.toLowerCase());

    if (!authorizedRoles.includes(userRole)) {
      console.warn(`🛡️ Security Alert: Access denied for role [${userRole}]`);
      return res.status(403).json({ 
        success: false, 
        message: `Role [${req.user.role}] is not authorized to access this resource.` 
      });
    }
    
    return next();
  };
};

/**
 * ✅ 3. LEGACY ADMIN CHECK (Optional Guard)
 * Simple backward-compatible check restricting routes exclusively to Admin users.
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "admin") {
    return next();
  } else {
    return res.status(403).json({ success: false, message: "Access restricted to Administrators." });
  }
};

// Exporting the combined module definitions cleanly
module.exports = { 
  protect, 
  allowRoles, 
  admin 
};