const express = require('express');
const {
  getHighlights,
  createHighlight,
  toggleLike,
} = require('../controllers/highlightController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getHighlights);
router.post('/', protect, createHighlight);
router.post('/:id/like', protect, toggleLike);

module.exports = router;
