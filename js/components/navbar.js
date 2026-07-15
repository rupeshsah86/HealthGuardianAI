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

// ── Theme Toggle ──────────────────────────────
function _bindThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  const root   = document.documentElement;

  const saved = localStorage.getItem('hg_theme') || 'light';
  _applyTheme(saved, toggle, root);

  toggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('hg_theme', next);
    _applyTheme(next, toggle, root);
  });
}

function _applyTheme(theme, toggle, root) {
  root.setAttribute('data-theme', theme);
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

// ── Active Link ────────────────────────────────
function _setActiveLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href')?.split('/').pop() || '';
    link.classList.toggle('active', href === currentPath);
  });
}
