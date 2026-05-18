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

// Fetch stats and fleet list
router.get("/dashboard", getOwnerDashboard);

// Add a new machine (Uses String _id logic)
router.post("/add-bike", addOwnerBike); 

// Update existing machine specs
router.put("/bike/:id", updateOwnerBike);

// Remove machine from system
router.delete("/bike/:id", deleteOwnerBike);

// Switch between 'Ready' and 'Maintenance'
router.patch("/maintenance/:id", toggleMaintenance);

module.exports = router;