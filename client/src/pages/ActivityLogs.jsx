import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function ActivityLogs() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const url = user.role === 'ADMIN' ? '/logs' : '/logs/user/mine';
      const { data } = await api.get(url);
      setLogs(data.logs);
      setLoading(false);
    })();
  }, [user.role]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Activity Logs</h1>
      {loading ? (
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">File</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Cell</th>
                <th className="px-4 py-2.5">Before → After</th>
                <th className="px-4 py-2.5">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-4 text-gray-400">No activity recorded yet.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2.5">{l.user?.name}</td>
                    <td className="px-4 py-2.5">{l.file?.filename}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        l.action === 'ACCESS_DENIED' ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {l.action.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {l.cellLocation?.row !== undefined ? `R${l.cellLocation.row + 1}C${l.cellLocation.column + 1}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {l.oldValue !== null && l.newValue !== null ? `${l.oldValue || '(empty)'} → ${l.newValue}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
