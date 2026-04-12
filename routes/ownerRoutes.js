const express = require("express");
const router = express.Router();
const { 
    getOwnerDashboard, 
    addOwnerBike, 
    updateOwnerBike, 
    deleteOwnerBike,
    toggleMaintenance 
} = require("../controllers/ownerController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// All routes are protected and restricted to Owners
router.use(protect);
router.use(allowRoles("owner"));

router.get("/dashboard", getOwnerDashboard);
router.post("/add-bike", addOwnerBike); 
router.put("/bike/:id", updateOwnerBike);
router.delete("/bike/:id", deleteOwnerBike);
router.patch("/maintenance/:id", toggleMaintenance);

module.exports = router;