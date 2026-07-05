const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'ExcelFile', required: true },
    action: {
      type: String,
      enum: [
        'CELL_UPDATE',
        'FILE_UPLOAD',
        'FILE_CREATE',
        'FILE_DELETE',
        'PERMISSION_GRANT',
        'PERMISSION_REVOKE',
        'FILE_DOWNLOAD',
        'ACCESS_DENIED',
      ],
      required: true,
    },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    cellLocation: {
      sheetIndex: Number,
      row: Number,
      column: Number,
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ file: 1, createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
