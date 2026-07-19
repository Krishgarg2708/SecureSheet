const ActivityLog = require('../models/ActivityLog');

// @route GET /api/logs/file/:fileId (ADMIN or file owner) - version history for a file
exports.getFileLogs = async (req, res) => {
  const logs = await ActivityLog.find({ file: req.params.fileId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(500);
  res.json({ success: true, logs });
};
// @route GET /api/logs/user/mine - my own activity timeline
exports.getMyLogs = async (req, res) => {
  const logs = await ActivityLog.find({ user: req.user._id })
    .populate('file', 'filename')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, logs });
};

// @route GET /api/logs (ADMIN) - global activity feed
exports.getAllLogs = async (req, res) => {
  const logs = await ActivityLog.find()
    .populate('user', 'name email')
    .populate('file', 'filename')
    .sort({ createdAt: -1 })
    .limit(500);
  res.json({ success: true, logs });
};
