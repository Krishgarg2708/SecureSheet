const express = require('express');
const router = express.Router();
const { getFileLogs, getMyLogs, getAllLogs } = require('../controllers/logController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', requireRole('ADMIN'), getAllLogs);
router.get('/user/mine', getMyLogs);
router.get('/file/:fileId', requireRole('ADMIN'), getFileLogs);

module.exports = router;
