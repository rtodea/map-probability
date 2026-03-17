/**
 * state.js — Application state container.
 *
 * Simple pub/sub state management. Holds current year, zoom level,
 * granularity, and selected region. Components subscribe to changes.
 *
 * Public API:
 *   createState(initial)  — create a state instance
 *   state.get(key)        — read a value
 *   state.set(key, value) — update a value, notify subscribers
 *   state.subscribe(fn)   — register a listener, returns unsubscribe fn
 */

export const createState = (initial = {}) => {
  let data = { ...initial };
  const listeners = new Set();

  return {
    get: (key) => data[key],

    getAll: () => ({ ...data }),

    set: (key, value) => {
      if (data[key] === value) return;
      data = { ...data, [key]: value };
      listeners.forEach((fn) => fn(key, value, data));
    },

    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};
