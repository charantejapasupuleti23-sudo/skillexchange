const express = require('express');
const router = express.Router();
const {
  getConnections,
  getConnectionById,
  getOrCreateConnection,
  disconnect,
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getConnections).post(getOrCreateConnection);
router.get('/:id', getConnectionById);
router.delete('/:id', disconnect);

module.exports = router;
