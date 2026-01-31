const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect middleware – checks JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token" });
  }
};

// Role-based access middleware
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// Export middleware
module.exports = {
  protect,
  allowRoles
};