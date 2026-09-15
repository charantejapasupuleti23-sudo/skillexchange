const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  markMessageAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:connectionId', getMessages);
router.post('/', sendMessage);
router.put('/:id/read', markMessageAsRead);

module.exports = router;
