const mongoose = require('mongoose');

// Each cell stored sparsely as { r, c, v, f } (row, col, value, formula) inside a sheet
const CellSchema = new mongoose.Schema(
  {
    r: { type: Number, required: true },
    c: { type: Number, required: true },
    v: { type: mongoose.Schema.Types.Mixed, default: '' },
    f: { type: String, default: null }, // formula, e.g. "=A1+B2"
  },
  { _id: false }
);

const SheetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Sheet1' },
    rows: { type: Number, default: 100 },
    columns: { type: Number, default: 26 },
    cells: { type: [CellSchema], default: [] },
  },
  { _id: false }
);

const ExcelFileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sheets: { type: [SheetSchema], default: [] },
    activeSheetIndex: { type: Number, default: 0 },
    originalFileType: { type: String, enum: ['xlsx', 'xls', 'csv', 'native'], default: 'native' },
  },
  { timestamps: true }
);

ExcelFileSchema.index({ owner: 1 });
ExcelFileSchema.index({ filename: 'text' });

module.exports = mongoose.model('ExcelFile', ExcelFileSchema);
