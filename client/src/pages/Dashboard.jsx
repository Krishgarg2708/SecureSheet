import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-700/20 flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [filesRes, logsRes] = await Promise.all([
          api.get('/files'),
          user.role === 'ADMIN' ? api.get('/logs') : api.get('/logs/user/mine'),
        ]);
        setFiles(filesRes.data.files);
        setLogs((logsRes.data.logs || []).slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, [user.role]);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {user.role === 'ADMIN' ? 'Workspace overview and recent activity.' : 'Your assigned sheets and recent activity.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Accessible Files" value={files.length} icon="📁" />
        <StatCard label="Recent Actions" value={logs.length} icon="🕒" />
        <StatCard label="Role" value={user.role} icon="🛡️" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold mb-3">Recent Files</h2>
          {files.length === 0 && <p className="text-sm text-gray-400">No files yet.</p>}
          <ul className="space-y-2">
            {files.slice(0, 6).map((f) => (
              <li key={f._id}>
                <Link
                  to={`/workspace/${f._id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  <span>📄 {f.filename}</span>
                  <span className="text-gray-400 text-xs">{new Date(f.updatedAt).toLocaleDateString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold mb-3">Activity Timeline</h2>
          {logs.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
          <ul className="space-y-3">
            {logs.map((l) => (
              <li key={l._id} className="text-sm border-l-2 border-brand-500 pl-3">
                <p className="font-medium">
                  {l.user?.name || 'Someone'} — {l.action.replaceAll('_', ' ')}
                </p>
                <p className="text-gray-400 text-xs">{new Date(l.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  );
}
