const express = require('express');
const {
  getWorkshops,
  getWorkshopById,
  createWorkshop,
  joinWorkshop,
  addQuestion,
  upvoteQuestion,
  answerQuestion,
} = require('../controllers/workshopController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getWorkshops);
router.get('/:id', getWorkshopById);
router.post('/', protect, createWorkshop);
router.post('/:id/join', protect, joinWorkshop);
router.post('/:id/questions', protect, addQuestion);
router.post('/:id/questions/:questionId/upvote', protect, upvoteQuestion);
router.put('/:id/questions/:questionId/answer', protect, answerQuestion);

module.exports = router;
