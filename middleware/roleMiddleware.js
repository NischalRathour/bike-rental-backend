exports.adminOnly = (req, res, next) => {
  if (req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admin only" });
};

exports.ownerOnly = (req, res, next) => {
  if (req.user.role === "owner") return next();
  return res.status(403).json({ message: "Owner only" });
};

exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};