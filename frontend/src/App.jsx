import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import WeeklyTimetable from './pages/WeeklyTimetable';
import Calendar from './pages/Calendar';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: '!rounded-xl !shadow-soft !border !border-gray-100 !font-sans',
          style: {
            background: '#fff',
            color: '#111827',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="timetable" element={<WeeklyTimetable />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="notes" element={<Notes />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      </SettingsProvider>
    </BrowserRouter>
  );
}
