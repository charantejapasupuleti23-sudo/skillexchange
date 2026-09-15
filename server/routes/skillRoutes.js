const express = require('express');
const router = express.Router();
const {
  getSkills,
  getSkillById,
  createSkill,
} = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getSkills).post(protect, createSkill);
router.route('/:id').get(getSkillById);

module.exports = router;
