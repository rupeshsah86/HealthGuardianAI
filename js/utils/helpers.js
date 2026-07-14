/**
 * Utility Functions
 * Emergency Healthcare AI Platform
 * ─────────────────────────────────
 * Pure, reusable helper functions. No side effects.
 */

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay - ms
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function call.
 * @param {Function} fn
 * @param {number} limit - ms
 */
export function throttle(fn, limit = 200) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Haversine formula — distance between two lat/lng points in km.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in km
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

/**
 * Format a distance number for display.
 * @param {number|null} km
 * @returns {string}
 */
export function formatDistance(km) {
  if (km === null || km === undefined) return 'Distance N/A';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/**
 * Sanitize a string to prevent XSS when injecting into innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Validate an email address.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate password strength (min 8 chars, 1 uppercase, 1 number).
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password) {
  if (password.length < 8)
    return { valid: false, message: 'Password must be at least 8 characters.' };
  if (!/[A-Z]/.test(password))
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  if (!/[0-9]/.test(password))
    return { valid: false, message: 'Password must contain at least one number.' };
  return { valid: true, message: '' };
}

/**
 * Generate a random alphanumeric meeting ID.
 * @param {string} prefix
 * @returns {string}
 */
export function generateMeetingId(prefix = 'HG') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (n) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${rand(4)}-${rand(4)}`;
}

/**
 * Format a Date object as HH:MM.
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format elapsed seconds as HH:MM:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/**
 * Get user's geolocation as a Promise.
 * @returns {Promise<GeolocationPosition>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  });
}

/**
 * Copy text to clipboard.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
