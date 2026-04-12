/**
 * ✅ UNIVERSAL ROLE GATEKEEPER (Recommended)
 * Logic: This is a Variadic Function that accepts multiple roles.
 * Use this for routes shared by different users (like Edit Profile).
 * Example: allowRoles("customer", "owner", "admin")
 */
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    // 1. Check if user object exists (must be run after 'protect' middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please log in." 
      });
    }

    // 2. Normalize roles to lowercase to prevent case-sensitivity bugs
    const userRole = req.user.role?.toLowerCase();
    const authorizedRoles = roles.map(r => r.toLowerCase());

    // 3. Authorization Check
    if (!authorizedRoles.includes(userRole)) {
      console.warn(`🚨 SECURITY ALERT: Role [${userRole}] blocked from path restricted to [${roles}]`);
      
      return res.status(403).json({ 
        success: false, 
        message: `Access Denied: Your account level (${userRole}) is not authorized for this resource.` 
      });
    }

    // 4. Success: Move to the next middleware or controller
    next();
  };
};

/**
 * 👑 ADMIN ONLY GUARD
 * Use this for system-wide settings, deleting users, or financial logs.
 */
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "admin") {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: "Restricted: Administrator privileges required." 
  });
};

/**
 * 🚲 OWNER ONLY GUARD
 * Use this for bike fleet management and earning reports.
 */
exports.ownerOnly = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "owner") {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: "Restricted: Fleet Partner/Owner privileges required." 
  });
};