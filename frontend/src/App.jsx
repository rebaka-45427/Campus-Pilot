import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './layouts/MainLayout';
import Loader from './components/Loader';

// Lazy loading pages
const Login = React.lazy(() => import('./pages/Login'));
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
        <Suspense fallback={<Loader fullScreen={true} />}>
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
        </Suspense>
      </SettingsProvider>
    </BrowserRouter>
  );
}
