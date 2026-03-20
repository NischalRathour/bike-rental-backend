const express = require('express');
const router = express.Router();
const { 
  getOwnerDashboard, 
  addOwnerBike, 
  updateOwnerBike, 
  deleteOwnerBike,
  toggleMaintenance
} = require('../controllers/ownerController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// All routes are protected to Owners and Admins
router.use(protect, allowRoles('owner', 'admin'));

router.get('/dashboard', getOwnerDashboard);
router.post('/add-bike', addOwnerBike);
router.put('/bike/:id', updateOwnerBike);
router.patch('/bike/:id/maintenance', toggleMaintenance);
router.delete('/bike/:id', deleteOwnerBike);

module.exports = router;