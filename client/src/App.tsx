import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FilesList from './pages/FilesList';
import UploadExcel from './pages/UploadExcel';
import CreateSheet from './pages/CreateSheet';
import ExcelWorkspace from './pages/ExcelWorkspace';
import ManageUsers from './pages/ManageUsers';
import PermissionEditor from './pages/PermissionEditor';
import ActivityLogs from './pages/ActivityLogs';
import DownloadCenter from './pages/DownloadCenter';
import Profile from './pages/Profile';

const withLayout = (el) => <MainLayout>{el}</MainLayout>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<ProtectedRoute>{withLayout(<Dashboard />)}</ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/files" element={<ProtectedRoute roles={['ADMIN']}>{withLayout(<FilesList />)}</ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute roles={['ADMIN']}>{withLayout(<UploadExcel />)}</ProtectedRoute>} />
      <Route path="/create-sheet" element={<ProtectedRoute roles={['ADMIN']}>{withLayout(<CreateSheet />)}</ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}>{withLayout(<ManageUsers />)}</ProtectedRoute>} />
      <Route path="/permissions/:fileId" element={<ProtectedRoute roles={['ADMIN']}>{withLayout(<PermissionEditor />)}</ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute roles={['ADMIN']}>{withLayout(<ActivityLogs />)}</ProtectedRoute>} />

      {/* User routes */}
      <Route path="/my-sheets" element={<ProtectedRoute roles={['USER']}>{withLayout(<FilesList />)}</ProtectedRoute>} />
      <Route path="/downloads" element={<ProtectedRoute roles={['USER']}>{withLayout(<DownloadCenter />)}</ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute>{withLayout(<Profile />)}</ProtectedRoute>} />

      {/* Shared */}
      <Route path="/workspace/:fileId" element={<ProtectedRoute>{withLayout(<ExcelWorkspace />)}</ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
