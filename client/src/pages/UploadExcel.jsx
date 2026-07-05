import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function UploadExcel() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setStatus('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('Uploaded successfully!');
      setTimeout(() => navigate(`/workspace/${data.file._id}`), 700);
    } catch (err) {
      setStatus(err.response?.data?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">Upload Excel File</h1>
      <p className="text-gray-500 text-sm mb-6">Supported formats: .xlsx, .xls, .csv (max 15MB)</p>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
      >
        <div className="text-4xl">⬆️</div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-sm"
        />
        {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        <button
          type="submit"
          disabled={!file || loading}
          className="px-5 py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload & Parse'}
        </button>
        {status && <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>}
      </form>
    </div>
  );
}
