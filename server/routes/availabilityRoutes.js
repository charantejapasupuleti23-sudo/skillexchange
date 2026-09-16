const express = require('express');
const {
  getMentorAvailability,
  getMyAvailability,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/mentor/:userId', getMentorAvailability);
router.get('/my', protect, getMyAvailability);
router.post('/', protect, createAvailabilitySlot);
router.delete('/:id', protect, deleteAvailabilitySlot);

module.exports = router;
