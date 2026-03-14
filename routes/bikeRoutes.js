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

const { protect, allowRoles } = require("../middleware/authMiddleware");

/* ================= PUBLIC ROUTES ================= */
// Must stay at the top
router.get("/", getAllBikes);
router.get("/:id", getBikeById); 

/* ================= ADMIN/OWNER ACTIONS ================= */
// Protect all management routes
router.post("/", protect, allowRoles("admin", "owner"), addBike);
router.get("/my-inventory", protect, allowRoles("admin", "owner"), getOwnerBikes);
router.patch("/:id", protect, allowRoles("admin", "owner"), updateBike);
router.delete("/:id", protect, allowRoles("admin", "owner"), deleteBike);

module.exports = router;