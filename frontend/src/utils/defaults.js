// ============================================================
// CampusPilot – default demo data
// ============================================================
import { KEYS, getItem, setItem } from './storage';
import { generateId } from './storage';

const now = new Date();
const iso = (offsetDays = 0, h = 12, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const DEFAULT_PROFILE = {
  username: 'Rebaka Jesi',
  email: 'rebaka@example.com',
  college: 'Example University',
  department: 'Computer Science',
  year: 'Senior',
};

export const DEFAULT_SETTINGS = {
  theme: 'system',
  accent_color: 'purple',
  notifications: true,
  email_notifications: false,
  desktop_notifications: false,
  language: 'English',
  timezone: 'UTC',
};

export const DEFAULT_TASKS = [
  {
    id: generateId(),
    title: 'Read Chapter 5 – Data Structures',
    category: 'Study',
    priority: 'High',
    status: 'pending',
    deadline: iso(1, 18, 0),
    estimated_time: '2 hours',
    notes: 'Focus on binary trees',
    created_at: iso(-2),
    completed_at: null,
  },
  {
    id: generateId(),
    title: 'Submit Physics Lab Report',
    category: 'Assignment',
    priority: 'High',
    status: 'pending',
    deadline: iso(2, 17, 0),
    estimated_time: '3 hours',
    notes: '',
    created_at: iso(-1),
    completed_at: null,
  },
  {
    id: generateId(),
    title: 'Review Lecture Notes – Algorithms',
    category: 'Study',
    priority: 'Medium',
    status: 'completed',
    deadline: iso(-1, 20, 0),
    estimated_time: '1 hour',
    notes: '',
    created_at: iso(-5),
    completed_at: iso(-1, 21, 0),
  },
  {
    id: generateId(),
    title: 'Group Project – Database Schema Design',
    category: 'Project',
    priority: 'Medium',
    status: 'pending',
    deadline: iso(5, 15, 0),
    estimated_time: '4 hours',
    notes: 'Coordinate with team members',
    created_at: iso(-3),
    completed_at: null,
  },
];

export const DEFAULT_ASSIGNMENTS = [
  {
    id: generateId(),
    title: 'Mathematics Problem Set 3',
    subject: 'Mathematics',
    priority: 'High',
    status: 'pending',
    due_date: iso(3, 23, 59),
    description: 'Integration and Differentiation problems',
    created_at: iso(-2),
  },
  {
    id: generateId(),
    title: 'Essay: Operating Systems History',
    subject: 'Computer Science',
    priority: 'Medium',
    status: 'in_progress',
    due_date: iso(6, 23, 59),
    description: 'Minimum 1500 words with references',
    created_at: iso(-3),
  },
  {
    id: generateId(),
    title: 'Physics Lab Practicals',
    subject: 'Physics',
    priority: 'High',
    status: 'submitted',
    due_date: iso(-1, 12, 0),
    description: 'Optics and Wave Mechanics experiments',
    created_at: iso(-7),
  },
];

export const DEFAULT_SUBJECTS = [
  {
    id: generateId(),
    name: 'Data Structures',
    total_classes: 30,
    classes_attended: 26,
  },
  {
    id: generateId(),
    name: 'Mathematics',
    total_classes: 28,
    classes_attended: 18,
  },
  {
    id: generateId(),
    name: 'Physics',
    total_classes: 20,
    classes_attended: 17,
  },
];

export const DEFAULT_NOTES = [
  {
    id: generateId(),
    title: 'Data Structures – Key Concepts',
    content: 'Binary Trees: Each node has at most 2 children. BST property: left < root < right.\n\nHeap: Max-heap — parent ≥ children. Min-heap — parent ≤ children.\n\nGraph traversal: BFS uses queue; DFS uses stack or recursion.',
    pinned: true,
    archived: false,
    created_at: iso(-4),
    updated_at: iso(-4),
  },
  {
    id: generateId(),
    title: 'Physics – Wave Equations',
    content: 'v = fλ (wave speed = frequency × wavelength)\nT = 1/f (period = 1/frequency)\nSnell\'s Law: n₁sin(θ₁) = n₂sin(θ₂)',
    pinned: false,
    archived: false,
    created_at: iso(-6),
    updated_at: iso(-6),
  },
  {
    id: generateId(),
    title: 'Old Semester Notes',
    content: 'These notes are from last semester. Kept for reference.',
    pinned: false,
    archived: true,
    created_at: iso(-30),
    updated_at: iso(-30),
  },
];

export const DEFAULT_TIMETABLE = [
  { id: generateId(), day: 'Monday',    subject: 'Data Structures', start_time: '09:00', end_time: '10:00', room: 'Lab 101' },
  { id: generateId(), day: 'Monday',    subject: 'Mathematics',     start_time: '11:00', end_time: '12:00', room: 'Room 202' },
  { id: generateId(), day: 'Tuesday',   subject: 'Physics',         start_time: '09:00', end_time: '10:30', room: 'Lab 305' },
  { id: generateId(), day: 'Tuesday',   subject: 'Data Structures', start_time: '14:00', end_time: '15:00', room: 'Room 101' },
  { id: generateId(), day: 'Wednesday', subject: 'Mathematics',     start_time: '09:00', end_time: '10:00', room: 'Room 202' },
  { id: generateId(), day: 'Wednesday', subject: 'Physics',         start_time: '11:00', end_time: '12:00', room: 'Lab 305' },
  { id: generateId(), day: 'Thursday',  subject: 'Data Structures', start_time: '10:00', end_time: '11:00', room: 'Lab 101' },
  { id: generateId(), day: 'Friday',    subject: 'Mathematics',     start_time: '09:00', end_time: '10:00', room: 'Room 202' },
  { id: generateId(), day: 'Friday',    subject: 'Physics',         start_time: '13:00', end_time: '14:30', room: 'Lab 305' },
];

export const DEFAULT_ACTIVITY = [
  { id: generateId(), action: 'Created', details: 'Task "Read Chapter 5" created', created_at: iso(-2) },
  { id: generateId(), action: 'Completed', details: 'Task "Review Lecture Notes – Algorithms" completed', created_at: iso(-1) },
  { id: generateId(), action: 'Created', details: 'Note "Data Structures – Key Concepts" created', created_at: iso(-4) },
  { id: generateId(), action: 'Marked Present', details: 'Marked present for Data Structures', created_at: iso(-1) },
];

/** Seed all defaults into localStorage if not already present */
export function seedDefaults() {
  if (getItem(KEYS.tasks) === null)       setItem(KEYS.tasks,       DEFAULT_TASKS);
  if (getItem(KEYS.assignments) === null) setItem(KEYS.assignments, DEFAULT_ASSIGNMENTS);
  if (getItem(KEYS.subjects) === null)    setItem(KEYS.subjects,    DEFAULT_SUBJECTS);
  if (getItem(KEYS.notes) === null)       setItem(KEYS.notes,       DEFAULT_NOTES);
  if (getItem(KEYS.timetable) === null)   setItem(KEYS.timetable,   DEFAULT_TIMETABLE);
  if (getItem(KEYS.settings) === null)    setItem(KEYS.settings,    DEFAULT_SETTINGS);
  if (getItem(KEYS.activity) === null)    setItem(KEYS.activity,    DEFAULT_ACTIVITY);
  if (getItem(KEYS.profile) === null)     setItem(KEYS.profile,     DEFAULT_PROFILE);
}

/** Hard reset: wipe campuspilot keys and re-seed */
export function resetToDefaults() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  setItem(KEYS.tasks,       DEFAULT_TASKS);
  setItem(KEYS.assignments, DEFAULT_ASSIGNMENTS);
  setItem(KEYS.subjects,    DEFAULT_SUBJECTS);
  setItem(KEYS.notes,       DEFAULT_NOTES);
  setItem(KEYS.timetable,   DEFAULT_TIMETABLE);
  setItem(KEYS.settings,    DEFAULT_SETTINGS);
  setItem(KEYS.activity,    DEFAULT_ACTIVITY);
  setItem(KEYS.profile,     DEFAULT_PROFILE);
}
