import React from 'react';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user } = useAuthStore();
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center text-xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">{user?.role}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
        </div>
      </div>
    </div>
  );
}
