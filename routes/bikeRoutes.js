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

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

/* ================= PUBLIC ROUTES ================= */
router.get("/", getAllBikes);

/* ================= OWNER ROUTES ================= */
// ⚠️ owner route MUST come before :id
router.get("/owner", protect, allowRoles("owner"), getOwnerBikes);

/* ================= PUBLIC BY ID ================= */
router.get("/:id", getBikeById);

/* ================= OWNER ACTIONS ================= */
router.post("/", protect, allowRoles("owner"), addBike);
router.patch("/:id", protect, allowRoles("owner"), updateBike);
router.delete("/:id", protect, allowRoles("owner"), deleteBike);

module.exports = router;