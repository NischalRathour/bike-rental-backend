const jwt = require("jsonwebtoken");
const User = require("../models/User"); // 🚨 IMPORTANT: Ensure ../models/User.js exists and uses module.exports = mongoose.model(...)

/**
 * ✅ 1. THE PROTECTOR (Authentication)
 * Logic: Verifies who the user is using the JWT and attaches the user (and balance) to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (this will now include the 'balance' field)
      // 🛠️ The error "User.findById is not a function" happened here because of import/export mismatch
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "User not found in system." });
      }

      next();
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
 * Logic: Checks if the user's role (customer, owner, admin) matches the required permissions.
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    // req.user was attached by the 'protect' middleware above
    if (!req.user || !roles.includes(req.user.role)) {
      console.warn(`🛡️ Security Alert: Access denied for role [${req.user?.role}]`);
      return res.status(403).json({ 
        success: false, 
        message: `Role [${req.user?.role}] is not authorized to access this resource.` 
      });
    }
    next();
  };
};

/**
 * ✅ 3. LEGACY ADMIN CHECK (Optional)
 * Useful for simple routes that only need admin access.
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access restricted to Administrators." });
  }
};

module.exports = { protect, allowRoles, admin };