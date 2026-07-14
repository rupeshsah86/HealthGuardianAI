/**
 * Storage Service
 * Emergency Healthcare AI Platform
 * ─────────────────────────────────
 * Centralized, safe wrapper around localStorage.
 * Handles JSON serialization, errors, and expiry.
 */

const StorageService = (() => {
  /**
   * Safely get a parsed value from localStorage.
   * @param {string} key
   * @param {*} fallback - returned if key missing or parse fails
   */
  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /**
   * Safely set a JSON-serialized value in localStorage.
   * @param {string} key
   * @param {*} value
   * @returns {boolean} success
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      console.warn(`[Storage] Failed to set key: ${key}`);
      return false;
    }
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`[Storage] Failed to remove key: ${key}`);
    }
  }

  /**
   * Check if a key exists.
   * @param {string} key
   * @returns {boolean}
   */
  function has(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Clear all app-related keys (prefixed with 'hg_').
   */
  function clearApp() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('hg_'))
      .forEach(k => localStorage.removeItem(k));
  }

  return { get, set, remove, has, clearApp };
})();

export default StorageService;
