const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelFile = require('../models/ExcelFile');
const Permission = require('../models/Permission');
const ActivityLog = require('../models/ActivityLog');
const { parseFileBuffer, sheetsToWorkbook, workbookToBuffer } = require('../services/excelService');

// @route POST /api/files/upload (ADMIN) - multipart upload, field name "file"
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const sheets = parseFileBuffer(req.file.buffer);

    const excelFile = await ExcelFile.create({
      filename: req.file.originalname,
      owner: req.user._id,
      sheets,
      originalFileType: ['xlsx', 'xls', 'csv'].includes(ext) ? ext : 'native',
    });

    await ActivityLog.create({
      user: req.user._id,
      file: excelFile._id,
      action: 'FILE_UPLOAD',
      meta: { filename: excelFile.filename },
    });

    res.status(201).json({ success: true, file: excelFile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed.', error: err.message });
  }
};

// @route POST /api/files (ADMIN) - create a blank sheet online
exports.createFile = async (req, res) => {
  try {
    const { filename, rows = 100, columns = 26 } = req.body;
    const excelFile = await ExcelFile.create({
      filename: filename || 'Untitled Sheet',
      owner: req.user._id,
      sheets: [{ name: 'Sheet1', rows, columns, cells: [] }],
      originalFileType: 'native',
    });

    await ActivityLog.create({
      user: req.user._id,
      file: excelFile._id,
      action: 'FILE_CREATE',
      meta: { filename: excelFile.filename },
    });

    res.status(201).json({ success: true, file: excelFile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Create failed.', error: err.message });
  }
};

// @route GET /api/files (all authenticated users - filtered by role)
exports.listFiles = async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const files = await ExcelFile.find().populate('owner', 'name email').sort({ updatedAt: -1 });
      return res.json({ success: true, files });
    }

    // Normal users only see files they have a permission record for
    const perms = await Permission.find({ userId: req.user._id }).select('fileId accessType');
    const fileIds = perms.map((p) => p.fileId);
    const files = await ExcelFile.find({ _id: { $in: fileIds } }).sort({ updatedAt: -1 });

    const filesWithAccess = files.map((f) => {
      const perm = perms.find((p) => String(p.fileId) === String(f._id));
      return { ...f.toObject(), accessType: perm?.accessType };
    });

    res.json({ success: true, files: filesWithAccess });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list files.', error: err.message });
  }
};

// @route GET /api/files/:fileId (protected by enforceFileReadAccess)
exports.getFile = async (req, res) => {
  const file = req.file; // set by enforceFileReadAccess middleware
  let editableRanges = [];
  if (req.user.role !== 'ADMIN' && String(file.owner) !== String(req.user._id)) {
    editableRanges = req.permission?.editableRange || [];
  }
  res.json({ success: true, file, editableRanges, isFullAccess: req.user.role === 'ADMIN' || String(file.owner) === String(req.user._id) });
};

// @route DELETE /api/files/:fileId (ADMIN)
exports.deleteFile = async (req, res) => {
  try {
    const file = await ExcelFile.findByIdAndDelete(req.params.fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    await Permission.deleteMany({ fileId: file._id });
    await ActivityLog.create({
      user: req.user._id,
      file: file._id,
      action: 'FILE_DELETE',
      meta: { filename: file.filename },
    });

    res.json({ success: true, message: 'File deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.', error: err.message });
  }
};

// @route GET /api/files/:fileId/download?format=xlsx|csv|pdf
exports.downloadFile = async (req, res) => {
  try {
    const file = req.file; // enforceFileReadAccess already loaded it
    const format = (req.query.format || 'xlsx').toLowerCase();

    await ActivityLog.create({
      user: req.user._id,
      file: file._id,
      action: 'FILE_DOWNLOAD',
      meta: { format },
    });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}.pdf"`);
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      doc.pipe(res);
      const sheet = file.sheets[file.activeSheetIndex] || file.sheets[0];
      doc.fontSize(14).text(file.filename, { underline: true });
      doc.moveDown();
      const grid = {};
      sheet.cells.forEach((c) => {
        grid[`${c.r}-${c.c}`] = c.v;
      });
      let y = doc.y;
      const colWidth = 60;
      for (let r = 0; r < Math.min(sheet.rows, 200); r++) {
        let x = 30;
        for (let c = 0; c < Math.min(sheet.columns, 12); c++) {
          const val = grid[`${r}-${c}`] ?? '';
          doc.fontSize(8).text(String(val), x, y, { width: colWidth, height: 14 });
          x += colWidth;
        }
        y += 14;
        if (y > 550) {
          doc.addPage();
          y = 30;
        }
      }
      doc.end();
      return;
    }

    const workbook = sheetsToWorkbook(file.sheets);
    const bookType = format === 'csv' ? 'csv' : 'xlsx';
    const buffer = workbookToBuffer(workbook, bookType);

    res.setHeader(
      'Content-Type',
      format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}.${bookType}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Download failed.', error: err.message });
  }
};
