const express = require('express');
const {
  getChannels,
  getChannelBySlug,
  postMessage,
  upvoteMessage,
} = require('../controllers/channelController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getChannels);
router.get('/:slug', getChannelBySlug);
router.post('/:slug/messages', protect, postMessage);
router.post('/:slug/messages/:messageId/upvote', protect, upvoteMessage);

module.exports = router;
