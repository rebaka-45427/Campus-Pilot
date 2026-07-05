import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { CheckCircle, Clock, BookOpen, GraduationCap, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import api from '../services/api';

const COLORS = ['#9333EA', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [stats, setStats] = useState({
    pieData: [],
    assignmentPie: [],
    barData: [],
    totalTasks: 0,
    completionRate: 0,
    assignmentsRate: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        const [analyticsRes, tasksRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/tasks')
        ]);
        
        const data = analyticsRes.data;
        const tasks = tasksRes.data;

        // Process Task History for Bar Chart (Last 6 months)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonth = new Date().getMonth();
        const barData = [];
        for (let i = 5; i >= 0; i--) {
          let m = currentMonth - i;
          if (m < 0) m += 12;
          
          const tasksInMonth = tasks.filter(t => new Date(t.created_at).getMonth() === m);
          const completed = tasksInMonth.filter(t => t.status === 'completed').length;
          const pending = tasksInMonth.length - completed;
          
          barData.push({
            name: monthNames[m],
            completed: completed,
            missed: pending
          });
        }

        setStats({
          pieData: data.charts.taskCategories,
          assignmentPie: data.charts.assignmentStatus,
          barData: barData,
          totalTasks: data.stats.totalTasks,
          completionRate: data.stats.completionRate,
          assignmentsRate: data.stats.assignmentsRate,
          attendanceRate: data.stats.attendanceRate
        });
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <Loader text="Loading analytics data..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load analytics</h3>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

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
              <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#9333EA" radius={[0, 0, 4, 4]} barSize={32} />
                <Bar dataKey="missed" name="Pending" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Categories (Pie) */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Task Categories Breakdown</h3>
          <div className="h-72 flex items-center justify-center">
            {stats.pieData.length > 0 ? (
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
            ) : (
              <div className="text-gray-400 text-sm">No task category data available</div>
            )}
          </div>
        </Card>

        {/* Assignment Status (Donut) */}
        <Card className="col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Assignment Completion Status</h3>
          <div className="h-72 flex items-center justify-center">
            {stats.assignmentPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.assignmentPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.assignmentPie.map((entry, index) => {
                      const colors = { 'Completed': '#10B981', 'Pending': '#F59E0B', 'Overdue': '#EF4444', 'No Data': '#E5E7EB' };
                      return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#9333EA'} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm">No assignment data available</div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
