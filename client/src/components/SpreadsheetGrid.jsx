import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const colLetter = (n) => {
  let s = '';
  n += 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

// Determine whether a given cell is inside any of the user's editable ranges
const isCellEditable = (ranges, sheetIndex, row, col, isFullAccess) => {
  if (isFullAccess) return true;
  if (!ranges || ranges.length === 0) return false;
  return ranges.some(
    (r) =>
      r.sheetIndex === sheetIndex &&
      row >= r.startRow &&
      row <= r.endRow &&
      col >= r.startColumn &&
      col <= r.endColumn
  );
};

export default function SpreadsheetGrid({ file, editableRanges = [], isFullAccess, onFileMutate }) {
  const [sheetIndex, setSheetIndex] = useState(file.activeSheetIndex || 0);
  const sheet = file.sheets[sheetIndex];
  const [cellMap, setCellMap] = useState(() => buildCellMap(sheet));
  const [selected, setSelected] = useState({ r: 0, c: 0 });
  const [search, setSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved successfully');
  const saveTimer = useRef(null);
  const visibleRows = Math.min(sheet.rows, 200);
  const visibleCols = Math.min(sheet.columns, 40);

  function buildCellMap(s) {
    const map = {};
    s.cells.forEach((c) => {
      map[`${c.r}-${c.c}`] = { v: c.v, f: c.f };
    });
    return map;
  }

  useEffect(() => {
    setCellMap(buildCellMap(file.sheets[sheetIndex]));
  }, [sheetIndex, file]);

  const saveCell = useCallback(
    async (row, column, value) => {
      setSaveStatus('Saving...');
      try {
        await api.patch(`/files/${file._id}/cell`, { sheetIndex, row, column, value });
        setSaveStatus('Saved successfully');
      } catch (err) {
        setSaveStatus(err.response?.data?.message === 'ACCESS DENIED' ? 'ACCESS DENIED' : 'Error saving');
      }
    },
    [file._id, sheetIndex]
  );

  const handleCellChange = (row, col, value) => {
    const editable = isCellEditable(editableRanges, sheetIndex, row, col, isFullAccess);
    if (!editable) return; // frontend guard only - backend is the real enforcement
    setCellMap((prev) => ({ ...prev, [`${row}-${col}`]: { v: value, f: null } }));

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCell(row, col, value), 700); // auto save every ~700ms of inactivity
  };

  const handleManualSave = () => {
    const { r, c } = selected;
    const val = cellMap[`${r}-${c}`]?.v ?? '';
    saveCell(r, c, val);
  };

  const filteredMatch = (row, col) => {
    if (!search) return false;
    const val = cellMap[`${row}-${col}`]?.v;
    return val !== undefined && String(val).toLowerCase().includes(search.toLowerCase());
  };

  const statusColor =
    saveStatus === 'Saving...' ? 'text-amber-500' : saveStatus === 'Saved successfully' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {file.sheets.map((s, i) => (
            <button
              key={i}
              onClick={() => setSheetIndex(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                i === sheetIndex
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cells..."
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className={`text-sm font-medium ${statusColor}`}>{saveStatus}</span>
          <button
            onClick={handleManualSave}
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-700"
          >
            Save now
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-800 rounded-xl">
        <table className="border-collapse text-sm select-none">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 bg-gray-100 dark:bg-gray-800 w-10 border border-gray-200 dark:border-gray-700"></th>
              {Array.from({ length: visibleCols }).map((_, c) => (
                <th
                  key={c}
                  className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium min-w-[90px]"
                >
                  {colLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: visibleRows }).map((_, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center font-medium px-2">
                  {r + 1}
                </td>
                {Array.from({ length: visibleCols }).map((_, c) => {
                  const editable = isCellEditable(editableRanges, sheetIndex, r, c, isFullAccess);
                  const val = cellMap[`${r}-${c}`]?.v ?? '';
                  const isSelected = selected.r === r && selected.c === c;
                  const isMatch = filteredMatch(r, c);
                  return (
                    <td
                      key={c}
                      className={`border border-gray-200 dark:border-gray-800 p-0 ${
                        editable ? 'cell-editable' : 'cell-readonly'
                      } ${isSelected ? 'ring-2 ring-brand-500 ring-inset' : ''} ${
                        isMatch ? 'bg-yellow-100 dark:bg-yellow-900/40' : ''
                      }`}
                      onClick={() => setSelected({ r, c })}
                      title={editable ? '' : 'Read only'}
                    >
                      <input
                        value={val}
                        disabled={!editable}
                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                        className="w-full h-full px-2 py-1 bg-transparent outline-none min-w-[90px] disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        {isFullAccess
          ? 'Full access: every cell is editable.'
          : 'Grey cells are read-only. Colored border marks your currently selected cell.'}
      </div>
    </div>
  );
}
