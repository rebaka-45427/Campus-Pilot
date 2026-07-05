// ============================================================
// CampusPilot – core localStorage helpers
// ============================================================

const KEYS = {
  tasks:       'campuspilot_tasks',
  assignments: 'campuspilot_assignments',
  subjects:    'campuspilot_subjects',
  notes:       'campuspilot_notes',
  timetable:   'campuspilot_timetable',
  settings:    'campuspilot_settings',
  activity:    'campuspilot_activity',
  profile:     'campuspilot_profile',
};

export { KEYS };

/** Read and parse a key, returning fallback if missing / corrupt */
export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Serialize and store any value */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage.setItem failed', e);
  }
}

/** Remove a single key */
export function removeItem(key) {
  localStorage.removeItem(key);
}

/** Clear ONLY campuspilot_* keys */
export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

// ── Array helpers ────────────────────────────────────────────

/** Get an array stored at key, defaulting to [] */
export function getList(key) {
  return getItem(key, []);
}

/** Append an item to the stored array and persist */
export function addToList(key, item) {
  const list = getList(key);
  list.push(item);
  setItem(key, list);
  return list;
}

/** Replace an item in the stored array (matched by id) and persist */
export function updateInList(key, id, updater) {
  const list = getList(key).map(item =>
    item.id === id ? (typeof updater === 'function' ? updater(item) : { ...item, ...updater }) : item
  );
  setItem(key, list);
  return list;
}

/** Remove an item by id from the stored array and persist */
export function removeFromList(key, id) {
  const list = getList(key).filter(item => item.id !== id);
  setItem(key, list);
  return list;
}

/** Generate a simple unique id */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
