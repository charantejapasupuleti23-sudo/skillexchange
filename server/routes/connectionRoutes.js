const express = require('express');
const router = express.Router();
const {
  getConnections,
  getConnectionById,
  disconnect,
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getConnections);
router.get('/:id', getConnectionById);
router.delete('/:id', disconnect);

module.exports = router;
