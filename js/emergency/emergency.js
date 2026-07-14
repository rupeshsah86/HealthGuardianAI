/**
 * Emergency Page Module
 * Emergency Healthcare AI Platform
 */

import { getCurrentPosition } from '../utils/helpers.js';
import Toast from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  _initSosButton();
  _initAccordion();
  _openHashGuide();
});

// ── SOS Button ──────────────────────────────────
function _initSosButton() {
  const btn    = document.getElementById('sosBtn');
  const status = document.getElementById('sosStatus');
  if (!btn || !status) return;

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;

    _setStatus(status, 'alerting', 'fa-circle-exclamation', 'Locating you and alerting emergency services...');

    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude } = pos.coords;
      console.info('[SOS] Location:', latitude, longitude);

      // Simulate dispatch (replace with real API call)
      await _delay(2000);

      _setStatus(status, 'success', 'fa-circle-check', 'Help is on the way! Estimated arrival: 7 minutes');
      Toast.success('Emergency services have been alerted!', 6000);

      // Re-enable after 30s
      setTimeout(() => {
        btn.disabled = false;
        _setStatus(status, '', 'fa-circle-check', 'Ready — tap SOS to activate');
      }, 30000);

    } catch (err) {
      btn.disabled = false;
      const msg = err.code === 1
        ? 'Location access denied. Please enable location and try again.'
        : 'Could not get location. Please call 102 directly.';
      _setStatus(status, '', 'fa-circle-xmark', msg);
      Toast.error(msg);
    }
  });
}

function _setStatus(el, cls, icon, text) {
  el.className = `sos-status-bar${cls ? ' ' + cls : ''}`;
  el.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
}

// ── Accordion ───────────────────────────────────
function _initAccordion() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-body').style.display = 'none';
        i.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked
      if (!isOpen) {
        item.classList.add('open');
        body.style.display = 'flex';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Open first by default
  const first = document.querySelector('.accordion-item');
  if (first) {
    first.classList.add('open');
    first.querySelector('.accordion-body').style.display = 'flex';
    first.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'true');
  }
}

// ── Hash-based guide opening ─────────────────────
function _openHashGuide() {
  if (!window.location.hash) return;
  const id = window.location.hash.slice(1);
  const target = document.getElementById(id);
  if (!target) return;

  // Close all, open target
  document.querySelectorAll('.accordion-item').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.accordion-body').style.display = 'none';
  });

  target.classList.add('open');
  target.querySelector('.accordion-body').style.display = 'flex';
  target.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'true');

  setTimeout(() => {
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 72;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset - 20, behavior: 'smooth' });
  }, 100);
}

function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
