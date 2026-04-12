const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * ✅ 1. THE PROTECTOR (Authentication)
 * Logic: Verifies who the user is using the JWT.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user to the request
      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) return res.status(401).json({ message: "User not found" });
      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) return res.status(401).json({ message: "No token provided" });
};

/**
 * ✅ 2. THE GATEKEEPER (Authorization)
 * Logic: Checks if the user's role is allowed to access the specific route.
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the user's current role exists in the permitted 'roles' array
    if (!req.user || !roles.includes(req.user.role)) {
      console.warn(`🚨 Security Alert: ${req.user?.role} blocked from restricted path.`);
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Role [${req.user?.role}] is not authorized.` 
      });
    }
    next();
  };
};

// Clean exports
module.exports = { protect, allowRoles };