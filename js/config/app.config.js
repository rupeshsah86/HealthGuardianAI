/**
 * App Configuration
 * Emergency Healthcare AI Platform
 * ─────────────────────────────────
 * Central config — change values here, not scattered across files.
 */

const AppConfig = Object.freeze({
  app: {
    name: 'HealthGuardian',
    version: '2.0.0',
    tagline: 'Emergency Healthcare AI Platform',
    supportEmail: 'help@healthguardian.com',
    supportPhone: '1-800-HELP',
    emergencyPhone: '108',
  },

  storage: {
    keys: {
      currentUser:  'hg_current_user',
      users:        'hg_users',
      theme:        'hg_theme',
      preferences:  'hg_preferences',
    },
  },

  map: {
    defaultCenter: { lat: 11.0168, lng: 76.9558 }, // Coimbatore
    defaultZoom: 13,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },

  ai: {
    responseDelay: { min: 800, max: 1800 },
    maxSymptomLength: 500,
  },

  pagination: {
    itemsPerPage: 10,
  },

  // Internal route map — use getRoute(key) to resolve correctly
  _routeMap: {
    home:       'index.html',
    login:      'pages/login.html',
    register:   'pages/register.html',
    emergency:  'pages/emergency.html',
    hospitals:  'pages/hospitals.html',
    bloodbank:  'pages/bloodbank.html',
    assistant:  'pages/assistant.html',
    video:      'pages/video.html',
  },
});

/**
 * Resolve a route key to a correct relative URL from the current page.
 * Works from both root (index.html) and subdirectory (pages/*.html).
 * @param {'home'|'login'|'register'|'emergency'|'hospitals'|'bloodbank'|'assistant'|'video'} key
 * @returns {string}
 */
export function getRoute(key) {
  const map = AppConfig._routeMap;
  const target = map[key] || map.home;
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  // If we're in a subdirectory (pages/), prefix with ../
  const prefix = depth > 1 ? '../' : '';
  return prefix + target;
}

export default AppConfig;
