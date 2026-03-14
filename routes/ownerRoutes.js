const express = require('express');
const router = express.Router();
const { 
  getOwnerBikes, 
  addOwnerBike, 
  updateOwnerBike, 
  deleteOwnerBike,
  getOwnerEarnings,
  getOwnerActiveRentals,
  toggleMaintenance
} = require('../controllers/ownerController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

router.use(protect, allowRoles('owner'));

router.get('/my-fleet', getOwnerBikes);
router.get('/earnings', getOwnerEarnings);
router.get('/active-rentals', getOwnerActiveRentals);
router.post('/add-bike', addOwnerBike);
router.put('/bike/:id', updateOwnerBike);
router.patch('/bike/:id/maintenance', toggleMaintenance); // ✅ Added
router.delete('/bike/:id', deleteOwnerBike);

module.exports = router;