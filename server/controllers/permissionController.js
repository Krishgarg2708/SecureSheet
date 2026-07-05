const Permission = require('../models/Permission');
const ActivityLog = require('../models/ActivityLog');

// @route POST /api/permissions (ADMIN)
// Body: { fileId, userId, editableRange: [{sheetIndex,startRow,endRow,startColumn,endColumn}], accessType }
exports.setPermission = async (req, res) => {
  try {
    const { fileId, userId, editableRange = [], accessType = 'READ_WRITE' } = req.body;
    if (!fileId || !userId) {
      return res.status(400).json({ success: false, message: 'fileId and userId are required.' });
    }

    const permission = await Permission.findOneAndUpdate(
      { fileId, userId },
      { editableRange, accessType },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      user: req.user._id,
      file: fileId,
      action: 'PERMISSION_GRANT',
      meta: { targetUser: userId, editableRange, accessType },
    });

    res.status(200).json({ success: true, permission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set permission.', error: err.message });
  }
};

// @route GET /api/permissions/file/:fileId (ADMIN) - see all permissions for a file
exports.getPermissionsForFile = async (req, res) => {
  const permissions = await Permission.find({ fileId: req.params.fileId }).populate('userId', 'name email');
  res.json({ success: true, permissions });
};

// @route GET /api/permissions/mine/:fileId (any user) - see own permission for a file
exports.getMyPermission = async (req, res) => {
  const permission = await Permission.findOne({ fileId: req.params.fileId, userId: req.user._id });
  res.json({ success: true, permission });
};

// @route DELETE /api/permissions/:id (ADMIN)
exports.revokePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    if (!permission) return res.status(404).json({ success: false, message: 'Permission not found.' });

    await ActivityLog.create({
      user: req.user._id,
      file: permission.fileId,
      action: 'PERMISSION_REVOKE',
      meta: { targetUser: permission.userId },
    });

    res.json({ success: true, message: 'Permission revoked.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to revoke.', error: err.message });
  }
};
