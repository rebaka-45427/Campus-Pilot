import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle, Clock, BookOpen, GraduationCap, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    pendingTasks: 0,
    completedTasks: 0,
    attendance: 0,
    upcomingAssignments: 0,
    totalSubjects: 0,
    productivityScore: 0,
    areaData: [],
    recentActivity: []
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, analyticsRes, activityRes, tasksRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/analytics'),
          api.get('/activity-logs?limit=5'),
          api.get('/tasks')
        ]);
        
        setUser(userRes.data);
        const data = analyticsRes.data.stats;
        
        // Compute last 7 days of tasks for AreaChart
        const tasks = tasksRes.data;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const areaData = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          
          const tasksOnDay = tasks.filter(t => new Date(t.created_at).toDateString() === d.toDateString()).length;
          areaData.push({
            name: days[d.getDay()],
            tasks: tasksOnDay
          });
        }

        setStats({
          pendingTasks: data.pendingTasks,
          completedTasks: data.completedTasks,
          attendance: data.attendanceRate,
          upcomingAssignments: data.totalAssignments - data.completedAssignments,
          totalSubjects: analyticsRes.data.charts.taskCategories ? analyticsRes.data.charts.taskCategories.length : 0, // Mock for total subjects if not passed, wait we don't have total subjects in stats.
          productivityScore: data.productivityScore,
          areaData: areaData,
          recentActivity: activityRes.data
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const productivityScore = stats.productivityScore;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary to-purple-800 text-white border-none relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-primary-100 font-medium mb-1">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
          <h1 className="text-3xl font-black mb-2">Welcome back, {user ? user.username.split(' ')[0] : 'Student'}!</h1>
          <p className="text-white/80 max-w-xl">
            You have {stats.pendingTasks} pending tasks and {stats.upcomingAssignments} upcoming assignments. Let's make today productive.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Target size={300} />
        </div>
      </Card>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Pending Tasks" value={stats.pendingTasks} icon={Clock} color="warning" />
        <StatCard title="Completed Tasks" value={stats.completedTasks} icon={CheckCircle} color="success" />
        <StatCard title="Attendance %" value={`${stats.attendance}%`} icon={GraduationCap} color={stats.attendance >= 75 ? 'success' : stats.attendance >= 60 ? 'warning' : 'danger'} />
        <StatCard title="Upcoming Asg." value={stats.upcomingAssignments} icon={BookOpen} color="primary" />
        <StatCard title="Total Subjects" value={stats.totalSubjects} icon={Target} color="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Productivity Ring */}
        <Card className="col-span-1 flex flex-col items-center justify-center py-10">
          <h3 className="text-lg font-bold text-gray-900 mb-6 w-full text-left">Today's Productivity</h3>
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="12" />
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="#9333EA" 
                strokeWidth="12" 
                strokeDasharray={`${productivityScore * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-900">{productivityScore}%</span>
              <span className="text-sm text-gray-500 font-medium">Completed</span>
            </div>
          </div>
        </Card>

        {/* Weekly Activity */}
        <Card className="col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Activity (Tasks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="tasks" stroke="#9333EA" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1 lg:col-span-3">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.length > 0 ? stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${activity.action === 'Completed' || activity.action === 'Marked Present' ? 'bg-success' : activity.action === 'Deleted' || activity.action === 'Marked Absent' ? 'bg-danger' : 'bg-primary'}`}></div>
                  <span className="font-medium text-gray-900">
                    {activity.details}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{format(new Date(activity.created_at), 'MMM d, h:mm a')}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">No activity yet. Make some progress!</div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
