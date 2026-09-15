const express = require('express');
const router = express.Router();
const {
  createRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createRequest);
router.get('/received', getReceivedRequests);
router.get('/sent', getSentRequests);
router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);
router.delete('/:id', cancelRequest);

module.exports = router;
