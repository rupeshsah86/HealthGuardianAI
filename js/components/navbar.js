/**
 * Navbar Component
 * Emergency Healthcare AI Platform
 * ─────────────────────────────────
 * Handles: scroll effect, mobile menu, theme toggle, profile dropdown.
 * Import and call initNavbar() on every page.
 */

import { syncNavAuthState, bindLogoutButton } from '../auth/auth.js';
import StorageService from '../storage/storage.service.js';
import AppConfig from '../config/app.config.js';

/**
 * Initialize all navbar behaviors.
 * Call once per page after DOM is ready.
 */
export function initNavbar() {
  syncNavAuthState();
  bindLogoutButton();
  _bindScrollEffect();
  _bindMobileMenu();
  _bindProfileDropdown();
  _bindThemeToggle();
  _setActiveLink();
}




//update code in nav.js
// ── Scroll Effect ──────────────────────────────
function _bindScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

// ── Mobile Menu ────────────────────────────────
function _bindMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on nav link click (mobile)
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

// ── Profile Dropdown ───────────────────────────
function _bindProfileDropdown() {
  const dropdown = document.querySelector('.profile-dropdown');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.profile-trigger');
  if (!trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // Keyboard accessibility
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dropdown.classList.toggle('open');
    }
    if (e.key === 'Escape') dropdown.classList.remove('open');
  });
}

// ── Theme Toggle ───────────────────────────────
function _bindThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const saved = StorageService.get(AppConfig.storage.keys.theme, 'light');
  _applyTheme(saved);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next    = current === 'light' ? 'dark' : 'light';
    _applyTheme(next);
    StorageService.set(AppConfig.storage.keys.theme, next);
  });
}

function _applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('.theme-toggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// ── Active Link ────────────────────────────────
function _setActiveLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href')?.split('/').pop() || '';
    link.classList.toggle('active', href === currentPath);
  });
}
