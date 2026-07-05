const express = require('express');
const router = express.Router();
const {
  setPermission,
  getPermissionsForFile,
  getMyPermission,
  revokePermission,
} = require('../controllers/permissionController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', requireRole('ADMIN'), setPermission);
router.get('/file/:fileId', requireRole('ADMIN'), getPermissionsForFile);
router.get('/mine/:fileId', getMyPermission);
router.delete('/:id', requireRole('ADMIN'), revokePermission);

module.exports = router;
