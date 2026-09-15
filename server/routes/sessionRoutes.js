const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getSessionById,
  acceptSession,
  rejectSession,
  cancelSession,
  completeSession,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getSessions).post(createSession);
router.route('/:id').get(getSessionById);
router.put('/:id/accept', acceptSession);
router.put('/:id/reject', rejectSession);
router.put('/:id/cancel', cancelSession);
router.put('/:id/complete', completeSession);

module.exports = router;
