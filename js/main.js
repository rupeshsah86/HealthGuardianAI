/**
 * main.js — Application Entry Point
 * Emergency Healthcare AI Platform
 * ─────────────────────────────────
 * Bootstraps shared behaviors on every page.
 */

import { initNavbar } from './components/navbar.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  _initSmoothScroll();
  _initScrollReveal();
});

// ── Smooth Scroll for anchor links ──────────────
function _initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--navbar-height')) || 72;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth',
      });
    });
  });
}

// ── Scroll Reveal Animation ──────────────────────
function _initScrollReveal() {
  const elements = document.querySelectorAll(
    '.feature-card, .quick-card, .testimonial-card, .stat-card, .location-card'
  );

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`;
    observer.observe(el);
  });
}
