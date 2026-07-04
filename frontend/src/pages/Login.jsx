import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('username', formData.username);
      params.append('password', formData.password);

      const res = await axios.post('http://localhost:8000/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      localStorage.setItem('token', res.data.access_token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-soft">
            CP
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
          CampusPilot<span className="text-primary">.os</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your student operating system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <Card className="px-10 py-12">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50 transition-colors"
                  placeholder="e.g. Rebaka Jesi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                {loading ? 'Signing in...' : (
                  <>
                    <LogIn size={20} className="mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            Secure offline environment. No signup required.
          </div>
        </Card>
      </div>
    </div>
  );
}
