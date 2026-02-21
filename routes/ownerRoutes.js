const express = require('express');
const router = express.Router();
const { 
  getOwnerBikes, 
  addOwnerBike, 
  updateOwnerBike, 
  deleteOwnerBike,
  getOwnerEarnings 
} = require('../controllers/ownerController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// Ensure only 'owner' role can enter
router.use(protect, allowRoles('owner'));

router.get('/my-fleet', getOwnerBikes);
router.get('/earnings', getOwnerEarnings);
router.post('/add-bike', addOwnerBike);
router.put('/bike/:id', updateOwnerBike);
router.delete('/bike/:id', deleteOwnerBike);

module.exports = router;