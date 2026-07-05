import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
const letterToCol = (letter) => {
  let n = 0;
  for (let i = 0; i < letter.length; i++) n = n * 26 + (letter.toUpperCase().charCodeAt(i) - 64);
  return n - 1;
};

export default function PermissionEditor() {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({
    userId: '',
    sheetIndex: 0,
    startRow: 1,
    endRow: 20,
    startCol: 'A',
    endCol: 'E',
    accessType: 'READ_WRITE',
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [fileRes, usersRes, permsRes] = await Promise.all([
      api.get(`/files/${fileId}`),
      api.get('/users'),
      api.get(`/permissions/file/${fileId}`),
    ]);
    setFile(fileRes.data.file);
    setUsers(usersRes.data.users.filter((u) => u.role === 'USER'));
    setPermissions(permsRes.data.permissions);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [fileId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/permissions', {
      fileId,
      userId: form.userId,
      accessType: form.accessType,
      editableRange: [
        {
          sheetIndex: Number(form.sheetIndex),
          startRow: Number(form.startRow) - 1,
          endRow: Number(form.endRow) - 1,
          startColumn: letterToCol(form.startCol),
          endColumn: letterToCol(form.endCol),
        },
      ],
    });
    load();
  };

  const handleRevoke = async (id) => {
    await api.delete(`/permissions/${id}`);
    load();
  };

  if (loading || !file) return <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Permissions — {file.filename}</h1>
        <p className="text-gray-500 text-sm">Grant a user exact row/column editable ranges. Everything else stays read-only for them.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium">Employee</label>
          <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm">
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Sheet</label>
          <select value={form.sheetIndex} onChange={(e) => setForm({ ...form, sheetIndex: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm">
            {file.sheets.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Start row</label>
          <input type="number" min={1} value={form.startRow} onChange={(e) => setForm({ ...form, startRow: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">End row</label>
          <input type="number" min={1} value={form.endRow} onChange={(e) => setForm({ ...form, endRow: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">Start column</label>
          <input value={form.startCol} onChange={(e) => setForm({ ...form, startCol: e.target.value.toUpperCase() })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm" placeholder="A" />
        </div>
        <div>
          <label className="text-xs font-medium">End column</label>
          <input value={form.endCol} onChange={(e) => setForm({ ...form, endCol: e.target.value.toUpperCase() })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm" placeholder="E" />
        </div>
        <div>
          <label className="text-xs font-medium">Access</label>
          <select value={form.accessType} onChange={(e) => setForm({ ...form, accessType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm">
            <option value="READ_WRITE">READ_WRITE</option>
            <option value="READ_ONLY">READ_ONLY</option>
          </select>
        </div>
        <button className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600">
          Save Permission
        </button>
      </form>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-left">
            <tr>
              <th className="px-4 py-2.5">User</th>
              <th className="px-4 py-2.5">Range</th>
              <th className="px-4 py-2.5">Access</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {permissions.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-4 text-gray-400">No permissions assigned yet.</td></tr>
            ) : (
              permissions.map((p) => (
                <tr key={p._id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2.5">{p.userId?.name} <span className="text-gray-400">({p.userId?.email})</span></td>
                  <td className="px-4 py-2.5">
                    {p.editableRange.map((r, i) => (
                      <div key={i}>
                        Sheet {r.sheetIndex + 1}: Rows {r.startRow + 1}-{r.endRow + 1}, Cols {colLetter(r.startColumn)}-{colLetter(r.endColumn)}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-2.5">{p.accessType}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => handleRevoke(p._id)} className="text-red-600 hover:underline text-xs">Revoke</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
