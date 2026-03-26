const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * --- PRIMARY AUTH GUARD ---
 * Verifies the JWT and attaches the user object to the request.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for Bearer token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Attach User to request (exclude password for security)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: "User session not found in database" 
        });
      }

      next();
    } catch (error) {
      console.error("🔒 Token Verification Error:", error.message);
      
      // If token is broken or malformed, tell the frontend to clear it
      return res.status(401).json({ 
        success: false, 
        message: error.message === "jwt malformed" 
          ? "Invalid session format. Please login again." 
          : "Session expired. Please login again." 
      });
    }
  }

  // 4. If no token was found at all
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Authorization token required for this action." 
    });
  }
};

/**
 * --- ROLE AUTHORIZATION GUARD ---
 * Restricts access to specific roles (e.g., 'admin', 'owner').
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.warn(`🚨 ROLE DENIED: ${req.user ? req.user.role : 'Guest'} tried to access a restricted path.`);
      
      return res.status(403).json({ 
        success: false, 
        message: `Permission Denied: Your account level (${req.user?.role || 'Guest'}) is not authorized.` 
      });
    }
    next();
  };
};

module.exports = { protect, allowRoles };