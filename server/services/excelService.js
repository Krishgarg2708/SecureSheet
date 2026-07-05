const XLSX = require('xlsx');

// Convert a SheetJS workbook into our internal sparse-cell sheet format
const workbookToSheets = (workbook) => {
  return workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const cells = [];

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (cell) {
          cells.push({
            r: R,
            c: C,
            v: cell.v !== undefined ? cell.v : '',
            f: cell.f ? `=${cell.f}` : null,
          });
        }
      }
    }

    return {
      name,
      rows: Math.max(range.e.r + 1, 100),
      columns: Math.max(range.e.c + 1, 26),
      cells,
    };
  });
};

// Parse an uploaded file buffer (xlsx/xls/csv) into our sheet format
const parseFileBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: true });
  return workbookToSheets(workbook);
};

// Convert our internal sheet format back into a SheetJS workbook for export
const sheetsToWorkbook = (sheets) => {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const ws = {};
    let maxR = 0;
    let maxC = 0;
    sheet.cells.forEach(({ r, c, v, f }) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr] = f ? { t: 's', f: f.replace(/^=/, ''), v } : { t: typeof v === 'number' ? 'n' : 's', v };
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    });
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  });
  return workbook;
};

const workbookToBuffer = (workbook, type) => XLSX.write(workbook, { type: 'buffer', bookType: type });

module.exports = { parseFileBuffer, sheetsToWorkbook, workbookToBuffer };
