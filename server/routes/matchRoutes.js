const express = require('express');
const router = express.Router();
const { getMatches, getMatchWithUser } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All match routes require authentication

router.get('/', getMatches);
router.get('/:userId', getMatchWithUser);

module.exports = router;
