const express = require('express');
const router = express.Router();
const {
  uploadFile,
  createFile,
  listFiles,
  getFile,
  deleteFile,
  downloadFile,
} = require('../controllers/fileController');
const { updateCell, updateCellsBatch } = require('../controllers/cellController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { enforceCellPermission, enforceFileReadAccess } = require('../middleware/permissionMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', listFiles);
router.post('/upload', requireRole('ADMIN'), upload.single('file'), uploadFile);
router.post('/', requireRole('ADMIN'), createFile);

router.get('/:fileId', enforceFileReadAccess, getFile);
router.delete('/:fileId', requireRole('ADMIN'), deleteFile);
router.get('/:fileId/download', enforceFileReadAccess, downloadFile);

// Single cell save - permission checked per request, never trusts frontend
router.patch('/:fileId/cell', enforceCellPermission, updateCell);

// Bulk save (paste / admin full edit) - admin or owner only
router.patch('/:fileId/cells/batch', enforceFileReadAccess, (req, res, next) => {
  if (req.user.role !== 'ADMIN' && String(req.file.owner) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'ACCESS DENIED: batch edit requires full access.' });
  }
  next();
}, updateCellsBatch);

module.exports = router;
