import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/files', label: 'Files', icon: '📁' },
  { to: '/upload', label: 'Upload Excel', icon: '⬆️' },
  { to: '/create-sheet', label: 'Create Sheet', icon: '➕' },
  { to: '/users', label: 'Manage Users', icon: '👥' },
  { to: '/logs', label: 'Activity Logs', icon: '🕒' },
];

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/my-sheets', label: 'My Sheets', icon: '📁' },
  { to: '/downloads', label: 'Download Center', icon: '⬇️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function MainLayout({ children }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? adminLinks : userLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-900 dark:text-gray-100">
      <aside className="w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">S</div>
          <span className="font-semibold text-lg">SecureSheet</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-100'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          Role: <span className="font-semibold">{user?.role}</span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="font-medium text-gray-700 dark:text-gray-200">Welcome, {user?.name}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:opacity-80"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">{children}</main>
      </div>
    </div>
  );
}
