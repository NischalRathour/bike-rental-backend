const express = require("express");
const router = express.Router();
const {
  getAllBikes,
  getBikeById,
  addBike,
  getOwnerBikes,
  updateBike,
  deleteBike,
} = require("../controllers/bikeController");

// ✅ Fix: Use ONLY authMiddleware.js for everything
const { protect, allowRoles } = require("../middleware/authMiddleware");

/* ================= PUBLIC ROUTES ================= */
router.get("/", getAllBikes);
router.get("/:id", getBikeById);

/* ================= OWNER/ADMIN ACTIONS ================= */
// If you are using "admin" to manage bikes, change "owner" to "admin" here
router.post("/", protect, allowRoles("admin"), addBike);
router.get("/owner", protect, allowRoles("admin"), getOwnerBikes);
router.patch("/:id", protect, allowRoles("admin"), updateBike);
router.delete("/:id", protect, allowRoles("admin"), deleteBike);

module.exports = router;