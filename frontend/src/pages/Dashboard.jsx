// === FILE: src/pages/Dashboard.jsx ===

import React, { useState, useEffect } from 'react';
import { KEYS, getList, getItem } from '../utils/storage';
import { getActivities } from '../utils/activity';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle,
  Clock,
  BookOpen,
  GraduationCap,
  Target,
  StickyNote,
} from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildAreaData(tasks) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayLabel = DAY_LABELS[d.getDay()];
    const dateStr = d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const count = tasks.filter((t) => {
      if (!t.created_at) return false;
      return t.created_at.slice(0, 10) === dateStr;
    }).length;
    return { day: dayLabel, tasks: count };
  });
}

function computeAttendanceRate(subjects) {
  let totalAttended = 0;
  let totalClasses = 0;
  subjects.forEach((s) => {
    const attended = Number(s.attended_classes ?? s.attended ?? 0);
    const total = Number(s.total_classes ?? s.total ?? 0);
    totalAttended += attended;
    totalClasses += total;
  });
  if (totalClasses === 0) return 0;
  return Math.round((totalAttended / totalClasses) * 100);
}

function getActivityDotColor(action = '') {
  const lower = action.toLowerCase();
  if (lower.includes('completed') || lower.includes('marked present')) {
    return 'bg-green-500';
  }
  if (lower.includes('deleted')) {
    return 'bg-red-500';
  }
  return 'bg-blue-500';
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState({ username: 'Student' });

  useEffect(() => {
    // Load profile
    const savedProfile = getItem(KEYS.profile, { username: 'Student' });
    setProfile(savedProfile);

    // Tasks
    const tasks = getList(KEYS.tasks);
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const productivityScore =
      tasks.length === 0
        ? 0
        : Math.round((completedTasks / tasks.length) * 100);

    // Subjects
    const subjects = getList(KEYS.subjects);
    const totalSubjects = subjects.length;
    const attendanceRate = computeAttendanceRate(subjects);

    // Assignments
    const assignments = getList(KEYS.assignments);
    const upcomingAssignments = assignments.filter(
      (a) => a.status !== 'submitted'
    ).length;

    // Notes
    const notes = getList(KEYS.notes).filter((n) => !n.archived).length;

    // Recent Activity
    const recentActivity = getActivities(5);

    // Area Chart data – last 7 days
    const areaData = buildAreaData(tasks);

    setStats({
      tasks,
      pendingTasks,
      completedTasks,
      productivityScore,
      subjects,
      totalSubjects,
      attendanceRate,
      assignments,
      upcomingAssignments,
      notes,
      recentActivity,
      areaData,
    });
  }, []);

  if (!stats) {
    // Minimal skeleton while computing (near-instant)
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const {
    pendingTasks,
    completedTasks,
    productivityScore,
    totalSubjects,
    attendanceRate,
    upcomingAssignments,
    notes,
    recentActivity,
    areaData,
  } = stats;

  // Productivity ring SVG calculation
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (productivityScore / 100) * ringCircumference;

  const firstName = profile.username ? profile.username.split(' ')[0] : 'Student';

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 border-0 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-blue-100 mt-1">
              {format(new Date(), "EEEE, MMMM d, yyyy")} — Let's make today
              count.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/20 rounded-xl px-4 py-2">
            <Target className="w-5 h-5" />
            <span className="font-semibold">{productivityScore}% Productive</span>
          </div>
        </div>
      </Card>

      {/* ── Top Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          title="Attendance %"
          value={`${attendanceRate}%`}
          icon={<GraduationCap className="w-5 h-5" />}
          color={attendanceRate >= 75 ? 'success' : 'danger'}
        />
        <StatCard
          title="Upcoming Assignments"
          value={upcomingAssignments}
          icon={<BookOpen className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total Subjects"
          value={totalSubjects}
          icon={<GraduationCap className="w-5 h-5" />}
          color="secondary"
        />
      </div>

      {/* ── Notes Stat ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Active Notes"
          value={notes}
          icon={<StickyNote className="w-5 h-5" />}
          color="primary"
        />
      </div>

      {/* ── Main 3-column grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Ring */}
        <Card className="flex flex-col items-center justify-center py-8">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6">
            Productivity Score
          </h2>
          <div className="relative flex items-center justify-center">
            <svg width="140" height="140" className="-rotate-90">
              {/* Background ring */}
              <circle
                cx="70"
                cy="70"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress ring */}
              <circle
                cx="70"
                cy="70"
                r={ringRadius}
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <defs>
                <linearGradient
                  id="ringGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">
                {productivityScore}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Score
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 w-full text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">{completedTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{pendingTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </Card>

        {/* Weekly Activity Chart */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Weekly Activity
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={areaData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="tasks"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#8b5cf6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Clock className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No recent activity yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <li key={activity.id ?? idx} className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${getActivityDotColor(
                      activity.action
                    )}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                      {activity.details}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.created_at
                        ? format(
                            new Date(activity.created_at),
                            'MMM d, h:mm a'
                          )
                        : '—'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
