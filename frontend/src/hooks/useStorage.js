// ============================================================
// useStorage – React hook for localStorage-backed state
// ============================================================
import { useState, useCallback } from 'react';
import { getList, setItem, addToList, updateInList, removeFromList, generateId } from '../utils/storage';

/**
 * A hook that mirrors a localStorage array as React state.
 *
 * @param {string} key – localStorage key (use KEYS.tasks etc.)
 * @returns {{ items, add, update, remove, setItems }}
 */
export function useStorageList(key) {
  const [items, setItems] = useState(() => getList(key));

  const refresh = useCallback(() => {
    setItems(getList(key));
  }, [key]);

  const add = useCallback((data) => {
    const item = { id: generateId(), created_at: new Date().toISOString(), ...data };
    const next = addToList(key, item);
    setItems([...next]);
    return item;
  }, [key]);

  const update = useCallback((id, updater) => {
    const next = updateInList(key, id, updater);
    setItems([...next]);
  }, [key]);

  const remove = useCallback((id) => {
    const next = removeFromList(key, id);
    setItems([...next]);
  }, [key]);

  const replace = useCallback((newList) => {
    setItem(key, newList);
    setItems([...newList]);
  }, [key]);

  return { items, add, update, remove, replace, refresh };
}
