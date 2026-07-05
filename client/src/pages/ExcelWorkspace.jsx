import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import SpreadsheetGrid from '../components/SpreadsheetGrid';

export default function ExcelWorkspace() {
  const { fileId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/files/${fileId}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load file.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fileId]);

  const handleDownload = async (format) => {
    const res = await api.get(`/files/${fileId}/download?format=${format}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.file.filename}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) return <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />;
  if (error) return <div className="text-red-600 bg-red-50 dark:bg-red-900/30 p-4 rounded-xl">{error}</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl font-bold">{data.file.filename}</h1>
        <div className="flex gap-2">
          <button onClick={() => handleDownload('xlsx')} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">
            Export .xlsx
          </button>
          <button onClick={() => handleDownload('csv')} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">
            Export .csv
          </button>
          <button onClick={() => handleDownload('pdf')} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">
            Export .pdf
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <SpreadsheetGrid
          file={data.file}
          editableRanges={data.editableRanges}
          isFullAccess={data.isFullAccess}
        />
      </div>
    </div>
  );
}
