import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  UserCircle, Mail, School, Building, Calendar,
  Lock, CheckCircle, BookOpen, GraduationCap
} from 'lucide-react';
import { KEYS, getList, getItem, setItem } from '../utils/storage';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const DEFAULT_PROFILE = {
  username: 'Rebaka Jesi',
  email: 'rebaka@example.com',
  college: '',
  department: '',
  year: '',
};

function getInitials(name = '') {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Profile() {
  const [user, setUser] = useState(() => getItem(KEYS.profile, DEFAULT_PROFILE));
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });

  // Inline stats — not stored in state
  const stats = useMemo(() => {
    const tasks = getList(KEYS.tasks);
    const subjects = getList(KEYS.subjects);

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalClasses = subjects.reduce((s, sub) => s + (sub.total_classes || 0), 0);
    const totalAttended = subjects.reduce((s, sub) => s + (sub.classes_attended || 0), 0);
    const attendanceRate =
      totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
    const productivityScore =
      tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

    return { completedTasks, attendanceRate, productivityScore };
  }, []);

  const handleUpdateProfile = (e) => {
    e.preventDefault();

    // Validate password match if entered
    if (passwordForm.password || passwordForm.confirmPassword) {
      if (passwordForm.password !== passwordForm.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (passwordForm.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    const payload = { ...user };
    setItem(KEYS.profile, payload);
    setUser(payload);
    setPasswordForm({ password: '', confirmPassword: '' });
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-purple-400" />
          Profile
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Avatar + Stats */}
        <div className="space-y-4">
          <Card className="p-6 flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600
                flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-500/30">
                {getInitials(user.username)}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>

            <div>
              <h2 className="text-white font-bold text-lg">{user.username || 'Student'}</h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
              {user.college && (
                <p className="text-gray-500 text-xs mt-0.5">{user.college}</p>
              )}
            </div>

            <Badge variant="purple">Student</Badge>
          </Card>

          {/* Stats */}
          <Card className="p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm mb-1">Your Stats</h3>
            {[
              {
                label: 'Tasks Done',
                value: stats.completedTasks,
                icon: <CheckCircle className="w-4 h-4 text-green-400" />,
                color: 'text-green-400',
              },
              {
                label: 'Attendance',
                value: `${stats.attendanceRate}%`,
                icon: <GraduationCap className="w-4 h-4 text-blue-400" />,
                color: 'text-blue-400',
              },
              {
                label: 'Prod. Score',
                value: `${stats.productivityScore}%`,
                icon: <BookOpen className="w-4 h-4 text-purple-400" />,
                color: 'text-purple-400',
              },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {icon} {label}
                </div>
                <span className={`font-bold text-sm ${color}`}>{value}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Right column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* Personal Information */}
            <Card className="p-5 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-purple-400" /> Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1">
                    <UserCircle className="w-3.5 h-3.5" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={user.username || ''}
                    onChange={e => setUser(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                      placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    onChange={e => setUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                      placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1">
                    <School className="w-3.5 h-3.5" /> College / University
                  </label>
                  <input
                    type="text"
                    value={user.college || ''}
                    onChange={e => setUser(prev => ({ ...prev, college: e.target.value }))}
                    placeholder="Your college name"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                      placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> Department
                  </label>
                  <input
                    type="text"
                    value={user.department || ''}
                    onChange={e => setUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                      placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Year of Study
                  </label>
                  <select
                    value={user.year || ''}
                    onChange={e => setUser(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                    <option value="pg">Post Graduate</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Change Password */}
            <Card className="p-5 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" /> Change Password
              </h3>
              <p className="text-gray-500 text-xs">Leave blank to keep your current password.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.password}
                    onChange={e => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                      placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repeat password"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                      placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" variant="primary" className="px-6">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
