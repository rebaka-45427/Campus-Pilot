import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, CheckCircle, Clock, GraduationCap, BookOpen } from 'lucide-react';
import { KEYS, getList } from '../utils/storage';
import Card from '../components/Card';
import StatCard from '../components/StatCard';

const CATEGORY_COLORS = {
  Study: '#9333EA',
  Assignment: '#3B82F6',
  Project: '#F59E0B',
  Personal: '#10B981',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-300 text-sm font-medium mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const tasks = getList(KEYS.tasks);
    const subjects = getList(KEYS.subjects);
    const assignments = getList(KEYS.assignments);

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const productivityScore =
      tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

    const totalClasses = subjects.reduce((s, sub) => s + (sub.total_classes || 0), 0);
    const totalAttended = subjects.reduce((s, sub) => s + (sub.classes_attended || 0), 0);
    const attendanceRate =
      totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

    // Tasks by category
    const categoryMap = {};
    tasks.forEach(t => {
      const cat = t.category || 'Personal';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const tasksByCategory = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#6B7280',
    }));

    // Attendance by subject
    const attendanceBySubject = subjects.map(s => ({
      name: s.name,
      attendance:
        s.total_classes === 0
          ? 0
          : Math.round((s.classes_attended / s.total_classes) * 100),
    }));

    // Weekly activity — last 7 days
    const weeklyActivity = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - i);
      const dayStr = dayDate.toDateString();
      const created = tasks.filter(
        t => t.created_at && new Date(t.created_at).toDateString() === dayStr
      ).length;
      const completed = tasks.filter(
        t =>
          t.status === 'completed' &&
          t.completed_at &&
          new Date(t.completed_at).toDateString() === dayStr
      ).length;
      weeklyActivity.push({
        name: dayNames[dayDate.getDay()],
        created,
        completed,
      });
    }

    setData({
      tasks,
      subjects,
      assignments,
      completedTasks,
      pendingTasks,
      productivityScore,
      attendanceRate,
      tasksByCategory,
      attendanceBySubject,
      weeklyActivity,
      totalSubjects: subjects.length,
      totalAssignments: assignments.length,
    });
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Analytics
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Your performance insights at a glance
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Productivity Score"
          value={`${data.productivityScore}%`}
          icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
          color="purple"
          subtitle={`${data.tasks.length} total tasks`}
        />
        <StatCard
          title="Completed Tasks"
          value={data.completedTasks}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          color="green"
          subtitle="tasks finished"
        />
        <StatCard
          title="Pending Tasks"
          value={data.pendingTasks}
          icon={<Clock className="w-5 h-5 text-yellow-400" />}
          color="yellow"
          subtitle="tasks remaining"
        />
        <StatCard
          title="Attendance Rate"
          value={`${data.attendanceRate}%`}
          icon={<GraduationCap className="w-5 h-5 text-blue-400" />}
          color="blue"
          subtitle={`${data.subjects.length} subjects`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tasks by Category — Pie Chart */}
        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" /> Tasks by Category
          </h2>
          {data.tasksByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
              No task data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.tasksByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.tasksByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Attendance by Subject — Bar Chart */}
        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-400" /> Attendance by Subject
          </h2>
          {data.attendanceBySubject.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
              No subject data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.attendanceBySubject} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="attendance" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Weekly Activity — Bar Chart */}
        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" /> Weekly Activity
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.weeklyActivity} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
              />
              <Bar dataKey="created" fill="#9333EA" radius={[4, 4, 0, 0]} name="Created" />
              <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Summary Stats Card */}
        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-yellow-400" /> Summary
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Total Tasks', value: data.tasks.length, color: 'text-purple-400' },
              { label: 'Completed Tasks', value: data.completedTasks, color: 'text-green-400' },
              { label: 'Pending Tasks', value: data.pendingTasks, color: 'text-yellow-400' },
              { label: 'Total Subjects', value: data.totalSubjects, color: 'text-blue-400' },
              { label: 'Total Assignments', value: data.totalAssignments, color: 'text-rose-400' },
              { label: 'Productivity Score', value: `${data.productivityScore}%`, color: 'text-purple-400' },
              { label: 'Overall Attendance', value: `${data.attendanceRate}%`, color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                <span className="text-gray-400 text-sm">{label}</span>
                <span className={`font-bold text-base ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
