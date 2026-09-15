const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  addTeachSkill,
  removeTeachSkill,
  addLearnSkill,
  removeLearnSkill,
  updateAvailability,
  updateLearningProgress,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getUsers);

// Specific static sub-routes must be registered BEFORE the dynamic /:id route
// to prevent Express matching e.g. GET /skills/teach as id="skills"
router.post('/skills/teach', protect, addTeachSkill);
router.delete('/skills/teach/:skillId', protect, removeTeachSkill);

router.post('/skills/learn', protect, addLearnSkill);
router.delete('/skills/learn/:skillId', protect, removeLearnSkill);

router.put('/availability', protect, updateAvailability);
router.put('/skills/progress', protect, updateLearningProgress);

// Dynamic route last — catches /:id only after all static paths are exhausted
router.get('/:id', getUserById);

module.exports = router;
