import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function DownloadCenter() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/files');
      setFiles(data.files);
      setLoading(false);
    })();
  }, []);

  const handleDownload = async (file, format) => {
    const res = await api.get(`/files/${file._id}/download?format=${format}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${file.filename}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Download Center</h1>
        <p className="text-gray-500 text-sm">Downloaded copies are yours locally — editing them never changes the shared server data.</p>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {files.map((f) => (
            <div key={f._id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{f.filename}</p>
                <p className="text-xs text-gray-400">Updated {new Date(f.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(f, 'xlsx')} className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800">XLSX</button>
                <button onClick={() => handleDownload(f, 'csv')} className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800">CSV</button>
                <button onClick={() => handleDownload(f, 'pdf')} className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800">PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
