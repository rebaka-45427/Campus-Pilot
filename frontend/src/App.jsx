import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './layouts/MainLayout';
import Loader from './components/Loader';

// Lazy loading pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Assignments = React.lazy(() => import('./pages/Assignments'));
const WeeklyTimetable = React.lazy(() => import('./pages/WeeklyTimetable'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));

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
        <Suspense fallback={<Loader fullScreen={true} />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
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
        </Suspense>
      </SettingsProvider>
    </BrowserRouter>
  );
}
