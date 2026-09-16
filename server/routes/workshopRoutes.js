const express = require('express');
const {
  getWorkshops,
  getWorkshopById,
  createWorkshop,
  joinWorkshop,
} = require('../controllers/workshopController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getWorkshops);
router.get('/:id', getWorkshopById);
router.post('/', protect, createWorkshop);
router.post('/:id/join', protect, joinWorkshop);

module.exports = router;
