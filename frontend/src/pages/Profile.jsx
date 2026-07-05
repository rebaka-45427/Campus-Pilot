import React, { useState, useEffect } from 'react';
import { UserCircle, Mail, School, Building, Calendar, Lock, CheckCircle, BookOpen, GraduationCap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import api from '../services/api';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [user, setUser] = useState({
    username: '',
    email: '',
    college: '',
    department: '',
    year: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });

  const [stats, setStats] = useState({
    completedTasks: 0,
    attendanceRate: 0,
    productivityScore: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      const currentUser = {
        id: 1,
        username: "Rebaka Jesi",
        email: "rebaka@example.com",
        college: "Example University",
        department: "Computer Science",
        year: "Senior"
      };
      
      const analyticsRes = await api.get('/analytics');
      
      setUser(currentUser);
      const data = analyticsRes.data.stats;
      setStats({
        completedTasks: data.completedTasks,
        attendanceRate: data.attendanceRate,
        productivityScore: data.productivityScore
      });
    } catch (error) {
      setIsError(true);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...user };
      if (passwordForm.password) {
        if (passwordForm.password !== passwordForm.confirmPassword) {
          return toast.error("Passwords don't match");
        }
        payload.password = passwordForm.password;
      }
      
      setUser(payload);
      setPasswordForm({ password: '', confirmPassword: '' });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return <Loader text="Loading profile..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load profile</h3>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-4xl mx-auto">
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
        <p className="text-gray-500 mt-1">Manage your account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent border-primary/10">
            <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-black shadow-lg mb-4">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{user.username}</h3>
            <p className="text-gray-500 text-sm mt-1">{user.email || 'No email set'}</p>
            <Badge variant="primary" className="mt-4">Member</Badge>

            <div className="w-full mt-6 space-y-3 pt-6 border-t border-primary/10 text-left">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center"><CheckCircle size={16} className="mr-2 text-success" /> Tasks Done</span>
                <span className="font-bold text-gray-900">{stats.completedTasks}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center"><GraduationCap size={16} className="mr-2 text-primary" /> Attendance</span>
                <span className="font-bold text-gray-900">{stats.attendanceRate}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center"><BookOpen size={16} className="mr-2 text-warning" /> Prod. Score</span>
                <span className="font-bold text-gray-900">{stats.productivityScore}%</span>
              </div>
            </div>
          </Card>
          
        </div>

        <div className="md:col-span-2">
          <Card>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><UserCircle size={16} className="mr-1 text-gray-400" /> Username</label>
                  <input type="text" value={user.username} disabled className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl" />
                  <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Mail size={16} className="mr-1 text-gray-400" /> Email</label>
                  <input type="email" value={user.email || ''} onChange={e => setUser({...user, email: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><School size={16} className="mr-1 text-gray-400" /> College</label>
                  <input type="text" value={user.college || ''} onChange={e => setUser({...user, college: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Building size={16} className="mr-1 text-gray-400" /> Department</label>
                  <input type="text" value={user.department || ''} onChange={e => setUser({...user, department: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Calendar size={16} className="mr-1 text-gray-400" /> Year</label>
                  <select value={user.year || ''} onChange={e => setUser({...user, year: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                    <option value="">Select Year</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 mt-8 pt-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Lock size={16} className="mr-1 text-gray-400" /> New Password</label>
                  <input type="password" value={passwordForm.password} onChange={e => setPasswordForm({...passwordForm, password: e.target.value})} placeholder="Leave blank to keep current" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Lock size={16} className="mr-1 text-gray-400" /> Confirm Password</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} placeholder="Leave blank to keep current" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button type="submit" className="px-8">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

    </div>
  );
}
