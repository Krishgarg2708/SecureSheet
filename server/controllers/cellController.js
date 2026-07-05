const ExcelFile = require('../models/ExcelFile');
const ActivityLog = require('../models/ActivityLog');

// @route PATCH /api/files/:fileId/cell   (protected by enforceCellPermission)
// Body: { sheetIndex, row, column, value, formula }
// Only ever receives ONE changed cell at a time - "send only updated cell".
exports.updateCell = async (req, res) => {
  try {
    const file = req.file; // loaded + permission-checked by middleware
    const { sheetIndex = 0, row, column, value, formula = null } = req.body;

    const sheet = file.sheets[sheetIndex];
    if (!sheet) return res.status(400).json({ success: false, message: 'Invalid sheet index.' });

    if (row < 0 || row >= sheet.rows || column < 0 || column >= sheet.columns) {
      return res.status(400).json({ success: false, message: 'Cell out of bounds.' });
    }

    const existing = sheet.cells.find((c) => c.r === row && c.c === column);
    const oldValue = existing ? existing.v : '';

    if (existing) {
      existing.v = value;
      existing.f = formula;
    } else {
      sheet.cells.push({ r: row, c: column, v: value, f: formula });
    }

    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      file: file._id,
      action: 'CELL_UPDATE',
      oldValue,
      newValue: value,
      cellLocation: { sheetIndex, row, column },
    });

    res.json({ success: true, message: 'Saved', cell: { row, column, value, formula } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving', error: err.message });
  }
};

// @route PATCH /api/files/:fileId/cells/batch  (ADMIN / owner full-access bulk edit, e.g. paste)
exports.updateCellsBatch = async (req, res) => {
  try {
    const file = req.file;
    const { sheetIndex = 0, cells } = req.body; // cells: [{ row, column, value, formula }]
    const sheet = file.sheets[sheetIndex];
    if (!sheet) return res.status(400).json({ success: false, message: 'Invalid sheet index.' });

    const logs = [];
    cells.forEach(({ row, column, value, formula = null }) => {
      const existing = sheet.cells.find((c) => c.r === row && c.c === column);
      const oldValue = existing ? existing.v : '';
      if (existing) {
        existing.v = value;
        existing.f = formula;
      } else {
        sheet.cells.push({ r: row, c: column, v: value, f: formula });
      }
      logs.push({
        user: req.user._id,
        file: file._id,
        action: 'CELL_UPDATE',
        oldValue,
        newValue: value,
        cellLocation: { sheetIndex, row, column },
      });
    });

    await file.save();
    await ActivityLog.insertMany(logs);

    res.json({ success: true, message: 'Batch saved', count: cells.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving batch', error: err.message });
  }
};
