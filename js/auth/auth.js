/**
 * Authentication Module
 * Emergency Healthcare AI Platform
 * ─────────────────────────────────
 * Handles login, registration, session management, and nav state.
 * Uses localStorage as a mock backend (ready for real API swap).
 */

import StorageService from '../storage/storage.service.js';
import { isValidEmail, validatePassword, sanitize } from '../utils/helpers.js';
import Toast from '../components/toast.js';
import AppConfig from '../config/app.config.js';

const { keys } = AppConfig.storage;

// ─────────────────────────────────────────────
// Session API
// ─────────────────────────────────────────────

/**
 * Get the currently logged-in user object, or null.
 * @returns {Object|null}
 */
export function getCurrentUser() {
  return StorageService.get(keys.currentUser, null);
}

/**
 * Check if a user is authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Log out the current user and redirect to home.
 */
export function logout() {
  StorageService.remove(keys.currentUser);
  Toast.info('You have been logged out.');
  setTimeout(() => { window.location.href = AppConfig.routes.home; }, 800);
}

// ─────────────────────────────────────────────
// Auth Actions
// ─────────────────────────────────────────────

/**
 * Attempt to log in with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, message: string }}
 */
export function login(email, password) {
  if (!email || !password) {
    return { success: false, message: 'Please fill in all fields.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const users = StorageService.get(keys.users, []);
  // NOTE: In production, passwords must be hashed (bcrypt/argon2) on the server.
  // This is a frontend-only demo using localStorage.
  const user = users.find(u => u.email === email.toLowerCase() && u.password === password);

  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }

  // Store session (exclude password from session object)
  const { password: _pw, ...sessionUser } = user;
  StorageService.set(keys.currentUser, sessionUser);
  return { success: true, message: 'Login successful.' };
}

/**
 * Register a new user.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, message: string }}
 */
export function register(name, email, password) {
  if (!name.trim() || !email || !password) {
    return { success: false, message: 'Please fill in all fields.' };
  }
  if (name.trim().length < 2) {
    return { success: false, message: 'Name must be at least 2 characters.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return { success: false, message: pwCheck.message };
  }

  const users = StorageService.get(keys.users, []);
  if (users.some(u => u.email === email.toLowerCase())) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const newUser = {
    id:        `usr_${Date.now()}`,
    name:      name.trim(),
    email:     email.toLowerCase(),
    password,  // NOTE: hash in production
    createdAt: new Date().toISOString(),
    avatar:    null,
  };

  users.push(newUser);
  StorageService.set(keys.users, users);

  // Auto-login after registration
  const { password: _pw, ...sessionUser } = newUser;
  StorageService.set(keys.currentUser, sessionUser);

  return { success: true, message: 'Account created successfully.' };
}

// ─────────────────────────────────────────────
// UI Binding
// ─────────────────────────────────────────────

/**
 * Update the navbar to reflect auth state.
 * Call this on every page load.
 */
export function syncNavAuthState() {
  const user = getCurrentUser();
  const loginBtn       = document.querySelector('.nav-login-btn');
  const profileDropdown= document.querySelector('.profile-dropdown');
  const profileName    = document.querySelector('.profile-name');
  const profileAvatar  = document.querySelector('.profile-avatar');

  if (user) {
    loginBtn?.classList.add('hidden');
    if (profileDropdown) {
      profileDropdown.classList.remove('hidden');
      if (profileName) profileName.textContent = user.name.split(' ')[0];
      if (profileAvatar) {
        if (user.avatar) {
          profileAvatar.innerHTML = `<img src="${sanitize(user.avatar)}" alt="${sanitize(user.name)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
          profileAvatar.textContent = user.name.charAt(0).toUpperCase();
        }
      }
    }
  } else {
    loginBtn?.classList.remove('hidden');
    profileDropdown?.classList.add('hidden');
  }
}

/**
 * Bind the login form on login.html.
 */
export function bindLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  // Redirect if already logged in
  if (isAuthenticated()) {
    window.location.href = AppConfig.routes.home;
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = form.querySelector('[type="submit"]');

    btn.classList.add('loading');
    btn.disabled = true;

    // Simulate async (ready for real API)
    setTimeout(() => {
      const result = login(email, password);
      btn.classList.remove('loading');
      btn.disabled = false;

      if (result.success) {
        Toast.success('Welcome back!');
        setTimeout(() => { window.location.href = AppConfig.routes.home; }, 800);
      } else {
        Toast.error(result.message);
        showFieldError('loginPassword', result.message);
      }
    }, 600);
  });
}

/**
 * Bind the registration form on register.html.
 */
export function bindRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  if (isAuthenticated()) {
    window.location.href = AppConfig.routes.home;
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name     = document.getElementById('registerName').value;
    const email    = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const btn      = form.querySelector('[type="submit"]');

    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
      const result = register(name, email, password);
      btn.classList.remove('loading');
      btn.disabled = false;

      if (result.success) {
        Toast.success('Account created! Redirecting...');
        setTimeout(() => { window.location.href = AppConfig.routes.home; }, 1000);
      } else {
        Toast.error(result.message);
      }
    }, 600);
  });
}

/**
 * Bind password visibility toggles.
 */
export function bindPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.closest('.input-wrapper').querySelector('input');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggle.className = `fas ${isPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`;
    });
  });
}

/**
 * Bind the logout button.
 */
export function bindLogoutButton() {
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');
  const existing = field.parentElement.querySelector('.form-error');
  if (existing) existing.remove();
  const err = document.createElement('span');
  err.className = 'form-error';
  err.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${sanitize(message)}`;
  field.parentElement.appendChild(err);
  field.addEventListener('input', () => {
    field.classList.remove('error');
    err.remove();
  }, { once: true });
}
