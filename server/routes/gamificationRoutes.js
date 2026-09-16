const express = require('express');
const {
  getRoadmaps,
  toggleRoadmapTopic,
  getWallet,
  getBadges,
} = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/roadmaps', getRoadmaps);
router.put('/roadmaps/:id/topic', toggleRoadmapTopic);
router.get('/wallet', getWallet);
router.get('/badges', getBadges);

module.exports = router;
