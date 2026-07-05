import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function FilesList() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/files');
    setFiles(data.files);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this file permanently?')) return;
    await api.delete(`/files/${id}`);
    load();
  };

  const filtered = files.filter((f) => f.filename.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{user.role === 'ADMIN' ? 'All Files' : 'My Sheets'}</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files..."
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No files found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <div
              key={f._id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="text-2xl">📄</div>
                {f.accessType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-100">
                    {f.accessType}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold truncate">{f.filename}</p>
                <p className="text-xs text-gray-400">Updated {new Date(f.updatedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  to={`/workspace/${f._id}`}
                  className="flex-1 text-center px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600"
                >
                  Open
                </Link>
                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to={`/permissions/${f._id}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm"
                    >
                      Permissions
                    </Link>
                    <button
                      onClick={() => handleDelete(f._id)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/30 dark:text-red-300"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
