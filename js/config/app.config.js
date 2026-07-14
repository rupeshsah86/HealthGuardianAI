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
    emergencyPhone: '+977-9829275143',
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

  routes: {
    // Resolved at runtime relative to root — use getRoute() helper
    home:       '/index.html',
    login:      '/pages/login.html',
    register:   '/pages/register.html',
    emergency:  '/pages/emergency.html',
    hospitals:  '/pages/hospitals.html',
    bloodbank:  '/pages/bloodbank.html',
    assistant:  '/pages/assistant.html',
    video:      '/pages/video.html',
  },
});

export default AppConfig;
