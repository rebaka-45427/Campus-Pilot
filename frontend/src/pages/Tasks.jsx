// === FILE: src/pages/Tasks.jsx ===

import React, { useState } from 'react';
import { KEYS, getList, setItem, generateId } from '../utils/storage';
import { addActivity } from '../utils/activity';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckSquare,
  Clock,
  Timer,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Study', 'Assignment', 'Project', 'Personal'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const FILTERS = ['All', 'pending', 'completed'];

const EMPTY_FORM = {
  title: '',
  category: 'Study',
  priority: 'Medium',
  deadline: '',
  estimated_time: '',
  notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityBadgeColor(priority) {
  switch (priority) {
    case 'High':
      return 'danger';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'primary';
    default:
      return 'primary';
  }
}

function formatDeadline(deadline) {
  if (!deadline) return null;
  try {
    return format(new Date(deadline), 'MMM d, yyyy h:mm a');
  } catch {
    return deadline;
  }
}

function isOverdue(task) {
  if (!task.deadline || task.status === 'completed') return false;
  return new Date(task.deadline) < new Date();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Tasks() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState(() => getList(KEYS.tasks));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ── Derived ────────────────────────────────────────────────────────────────
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter =
      filter === 'All' ? true : task.status === filter;
    return matchesSearch && matchesFilter;
  });

  // ── Persistence helper ─────────────────────────────────────────────────────
  function persist(updatedTasks) {
    setItem(KEYS.tasks, updatedTasks);
    setTasks(updatedTasks);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openModal(task = null) {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title ?? '',
        category: task.category ?? 'Study',
        priority: task.priority ?? 'Medium',
        deadline: task.deadline
          ? task.deadline.slice(0, 16) // trim seconds for datetime-local
          : '',
        estimated_time: task.estimated_time ?? '',
        notes: task.notes ?? '',
      });
    } else {
      setEditingTask(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData(EMPTY_FORM);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Task title is required.');
      return;
    }

    let updatedTasks;

    if (editingTask) {
      // Update existing task
      updatedTasks = tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              ...formData,
              deadline: formData.deadline
                ? new Date(formData.deadline).toISOString()
                : null,
            }
          : t
      );
      addActivity({
        action: 'Task updated',
        details: `Updated task: "${formData.title}"`,
      });
      toast.success('Task updated successfully!');
    } else {
      // Create new task
      const newTask = {
        id: generateId(),
        created_at: new Date().toISOString(),
        status: 'pending',
        completed_at: null,
        ...formData,
        deadline: formData.deadline
          ? new Date(formData.deadline).toISOString()
          : null,
      };
      updatedTasks = [...tasks, newTask];
      addActivity({
        action: 'Task created',
        details: `Created task: "${formData.title}"`,
      });
      toast.success('Task created successfully!');
    }

    persist(updatedTasks);
    closeModal();
  }

  function toggleStatus(task) {
    const isNowCompleted = task.status === 'pending';
    const updatedTasks = tasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            status: isNowCompleted ? 'completed' : 'pending',
            completed_at: isNowCompleted ? new Date().toISOString() : null,
          }
        : t
    );

    addActivity({
      action: isNowCompleted ? 'Completed' : 'Re-opened',
      details: `${isNowCompleted ? 'Completed' : 'Re-opened'} task: "${task.title}"`,
    });

    persist(updatedTasks);
    toast.success(
      isNowCompleted ? 'Task marked as completed!' : 'Task marked as pending.'
    );
  }

  function deleteTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!window.confirm(`Delete task "${task?.title}"? This cannot be undone.`)) {
      return;
    }
    const updatedTasks = tasks.filter((t) => t.id !== id);
    addActivity({
      action: 'Deleted',
      details: `Deleted task: "${task?.title}"`,
    });
    persist(updatedTasks);
    toast.success('Task deleted.');
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Tasks
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {completedCount} of {tasks.length} tasks completed
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="flex items-center gap-2"
          variant="primary"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* ── Progress Bar ────────────────────────────────────────────── */}
      <Card className="py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* ── Search & Filter ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Task List ───────────────────────────────────────────────── */}
      {filteredTasks.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckSquare className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-base font-medium">No tasks found.</p>
            <p className="text-sm mt-1">
              {search
                ? 'Try a different search term.'
                : 'Click "Add Task" to get started.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`group transition-all duration-200 hover:shadow-md ${
                task.status === 'completed'
                  ? 'opacity-70'
                  : ''
              } ${isOverdue(task) ? 'border-l-4 border-red-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Toggle Checkbox */}
                <button
                  onClick={() => toggleStatus(task)}
                  title={
                    task.status === 'completed'
                      ? 'Mark as pending'
                      : 'Mark as completed'
                  }
                  className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.status === 'completed'
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                  }`}
                >
                  {task.status === 'completed' && (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3
                      className={`font-semibold text-gray-800 dark:text-white text-base leading-tight ${
                        task.status === 'completed'
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {/* Action Buttons (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(task)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.priority && (
                      <Badge color={priorityBadgeColor(task.priority)}>
                        {task.priority} Priority
                      </Badge>
                    )}
                    {task.category && (
                      <Badge color="gray">{task.category}</Badge>
                    )}
                    {task.status === 'completed' && (
                      <Badge color="success">Completed</Badge>
                    )}
                    {isOverdue(task) && (
                      <Badge color="danger">Overdue</Badge>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {task.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDeadline(task.deadline)}
                      </span>
                    )}
                    {task.estimated_time && (
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {task.estimated_time}
                      </span>
                    )}
                    {task.completed_at && (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckSquare className="w-3.5 h-3.5" />
                        Done{' '}
                        {format(new Date(task.completed_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {task.notes && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                      {task.notes}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="e.g. Study Chapter 5"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleFormChange}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deadline
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleFormChange}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Time
            </label>
            <input
              type="text"
              name="estimated_time"
              value={formData.estimated_time}
              onChange={handleFormChange}
              placeholder="e.g. 2 hours, 45 min"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows={3}
              placeholder="Any additional notes…"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
