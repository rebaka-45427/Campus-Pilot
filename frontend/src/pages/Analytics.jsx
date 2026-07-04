import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { CheckCircle, Clock, BookOpen, GraduationCap } from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import api from '../services/api';

const COLORS = ['#9333EA', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const EMPTY_BAR_DATA = [
  { name: 'Jan', completed: 0, missed: 0 },
  { name: 'Feb', completed: 0, missed: 0 },
  { name: 'Mar', completed: 0, missed: 0 },
  { name: 'Apr', completed: 0, missed: 0 },
  { name: 'May', completed: 0, missed: 0 },
  { name: 'Jun', completed: 0, missed: 0 },
];

const EMPTY_LINE_DATA = [
  { month: 'Jan', attendance: 0 },
  { month: 'Feb', attendance: 0 },
  { month: 'Mar', attendance: 0 },
  { month: 'Apr', attendance: 0 },
  { month: 'May', attendance: 0 },
  { month: 'Jun', attendance: 0 },
];

export default function Analytics() {
  const [stats, setStats] = useState({
    pieData: [],
    totalTasks: 0,
    completionRate: 0,
    assignmentsRate: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [tasksRes, assignmentsRes, subjectsRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/assignments'),
          api.get('/subjects')
        ]);
        
        const tasks = tasksRes.data;
        const assignments = assignmentsRes.data;
        const subjects = subjectsRes.data;

        // Calculate Category distribution for Pie Chart
        const categories = {};
        tasks.forEach(t => {
          categories[t.category] = (categories[t.category] || 0) + 1;
        });
        const pieData = Object.keys(categories).map(key => ({ name: key, value: categories[key] }));

        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

        const completedAsg = assignments.filter(a => a.status === 'Completed').length;
        const asgRate = assignments.length ? Math.round((completedAsg / assignments.length) * 100) : 0;

        const totalClasses = subjects.reduce((sum, s) => sum + s.total_classes, 0);
        const totalAttended = subjects.reduce((sum, s) => sum + s.classes_attended, 0);
        const attendanceRate = totalClasses ? Math.round((totalAttended / totalClasses) * 100) : 0;

        setStats({
          pieData: pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1 }],
          totalTasks: tasks.length,
          completionRate,
          assignmentsRate: asgRate,
          attendanceRate
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-500 mt-1">Detailed performance tracking.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Task Completion" value={`${stats.completionRate}%`} icon={CheckCircle} color="primary" />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={Clock} color="warning" />
        <StatCard title="Assignment Success" value={`${stats.assignmentsRate}%`} icon={BookOpen} color="success" />
        <StatCard title="Overall Attendance" value={`${stats.attendanceRate}%`} icon={GraduationCap} color="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Completion History (Bar) */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Task Completion History</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EMPTY_BAR_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#9333EA" radius={[0, 0, 4, 4]} barSize={32} />
                <Bar dataKey="missed" name="Missed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Categories (Pie) */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Task Categories Breakdown</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance Trend (Line) */}
        <Card className="col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Trend (%)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EMPTY_LINE_DATA} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <YAxis domain={['dataMin - 5', 100]} axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
}
