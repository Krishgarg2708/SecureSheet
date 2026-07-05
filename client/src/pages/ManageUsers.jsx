import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/users');
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'USER' });
      load();
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (u) => {
    await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
    load();
  };

  const changeRole = async (u, role) => {
    await api.patch(`/users/${u._id}`, { role });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Remove this user?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>

      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-xs font-medium">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">Password</label>
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm">
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button disabled={creating} className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
          {creating ? 'Adding...' : 'Add User'}
        </button>
      </form>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-left">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-4 text-gray-400">Loading users...</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2.5">{u.name}</td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleActive(u)} className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => remove(u._id)} className="text-red-600 hover:underline text-xs">Remove</button>
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
