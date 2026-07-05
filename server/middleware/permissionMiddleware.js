const Permission = require('../models/Permission');
const ExcelFile = require('../models/ExcelFile');
const ActivityLog = require('../models/ActivityLog');

/**
 * Enforces cell-level write permission.
 * Expects req.body: { sheetIndex, row, column } at minimum for single-cell writes.
 * Admins (owner or role ADMIN) always pass.
 * Never trust the frontend — this is the single source of truth for write access.
 */
const enforceCellPermission = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { sheetIndex = 0, row, column } = req.body;

    if (row === undefined || column === undefined) {
      return res.status(400).json({ success: false, message: 'row and column are required.' });
    }

    const file = await ExcelFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Admins have full control over every file
    if (req.user.role === 'ADMIN' || String(file.owner) === String(req.user._id)) {
      req.file = file;
      return next();
    }

    const allowed = await Permission.canEditCell(fileId, req.user._id, sheetIndex, row, column);

    if (!allowed) {
      await ActivityLog.create({
        user: req.user._id,
        file: fileId,
        action: 'ACCESS_DENIED',
        cellLocation: { sheetIndex, row, column },
        meta: { reason: 'Cell outside editable range or no permission record.' },
      });
      return res.status(403).json({ success: false, message: 'ACCESS DENIED' });
    }

    req.file = file;
    next();
  } catch (err) {
    console.error('Permission check failed:', err.message);
    res.status(500).json({ success: false, message: 'Permission check failed.' });
  }
};

/**
 * Enforces read/view access to a file: owner, admin, or anyone with a permission record.
 */
const enforceFileReadAccess = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await ExcelFile.findById(fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    if (req.user.role === 'ADMIN' || String(file.owner) === String(req.user._id)) {
      req.file = file;
      return next();
    }

    const perm = await Permission.findOne({ fileId, userId: req.user._id });
    if (!perm) {
      return res.status(403).json({ success: false, message: 'ACCESS DENIED: no access to this file.' });
    }

    req.file = file;
    req.permission = perm;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Access check failed.' });
  }
};

module.exports = { enforceCellPermission, enforceFileReadAccess };
