const mongoose = require('mongoose');

const RangeSchema = new mongoose.Schema(
  {
    sheetIndex: { type: Number, default: 0 },
    startRow: { type: Number, required: true },
    endRow: { type: Number, required: true },
    startColumn: { type: Number, required: true }, // 0-indexed, A=0
    endColumn: { type: Number, required: true },
  },
  { _id: false }
);

const PermissionSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExcelFile', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    editableRange: { type: [RangeSchema], default: [] },
    accessType: {
      type: String,
      enum: ['READ_ONLY', 'READ_WRITE'],
      default: 'READ_WRITE',
    },
  },
  { timestamps: true }
);

PermissionSchema.index({ fileId: 1, userId: 1 }, { unique: true });

// Static helper: check whether a given user is allowed to write a specific cell
PermissionSchema.statics.canEditCell = async function (fileId, userId, sheetIndex, row, col) {
  const perm = await this.findOne({ fileId, userId });
  if (!perm) return false;
  if (perm.accessType !== 'READ_WRITE') return false;
  return perm.editableRange.some(
    (rng) =>
      rng.sheetIndex === sheetIndex &&
      row >= rng.startRow &&
      row <= rng.endRow &&
      col >= rng.startColumn &&
      col <= rng.endColumn
  );
};

module.exports = mongoose.model('Permission', PermissionSchema);
