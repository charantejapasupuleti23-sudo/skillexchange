const express = require('express');
const {
  getBounties,
  createBounty,
  submitAnswer,
  acceptAnswer,
} = require('../controllers/bountyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getBounties);
router.post('/', protect, createBounty);
router.post('/:id/answers', protect, submitAnswer);
router.put('/:id/answers/:answerId/accept', protect, acceptAnswer);

module.exports = router;
