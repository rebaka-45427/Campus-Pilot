// ============================================================
// CampusPilot – activity log helpers
// ============================================================
import { KEYS, getList, setItem, generateId } from './storage';

export function addActivity(details, action = 'Created') {
  const logs = getList(KEYS.activity);
  const newLog = {
    id: generateId(),
    action,
    details,
    created_at: new Date().toISOString(),
  };
  // Keep newest first, cap at 50
  const updated = [newLog, ...logs].slice(0, 50);
  setItem(KEYS.activity, updated);
  return updated;
}

export function getActivities(limit = 50) {
  return getList(KEYS.activity).slice(0, limit);
}

export function clearActivities() {
  setItem(KEYS.activity, []);
}
