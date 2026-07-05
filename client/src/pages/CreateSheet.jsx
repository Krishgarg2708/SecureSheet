import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreateSheet() {
  const [filename, setFilename] = useState('');
  const [rows, setRows] = useState(100);
  const [columns, setColumns] = useState(26);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/files', { filename, rows: Number(rows), columns: Number(columns) });
      navigate(`/workspace/${data.file._id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-1">Create New Sheet</h1>
      <p className="text-gray-500 text-sm mb-6">Start a blank spreadsheet directly in the browser.</p>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sheet name</label>
          <input
            required
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g. Q3 Budget Tracker"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rows</label>
            <input
              type="number"
              min={10}
              max={1000}
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Columns</label>
            <input
              type="number"
              min={5}
              max={100}
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Sheet'}
        </button>
      </form>
    </div>
  );
}
