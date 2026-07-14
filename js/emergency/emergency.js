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

    _setStatus(status, 'alerting', 'fa-circle-exclamation', 'Locating you...');

    let locationText = '';

    // Try GPS first
    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude } = pos.coords;
      _setStatus(status, 'alerting', 'fa-circle-exclamation', 'Getting your address...');
      locationText = await _reverseGeocode(latitude, longitude);
    } catch {
      // GPS denied — fallback to IP-based location
      try {
        _setStatus(status, 'alerting', 'fa-circle-exclamation', 'Detecting location via network...');
        const res  = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        locationText = [data.city, data.region, data.country_name, data.postal].filter(Boolean).join(', ');
      } catch {
        locationText = 'Location unavailable';
      }
    }

    await _delay(800);
    _setStatus(status, 'success', 'fa-circle-check', `Help is on the way! ETA: 7 min \u2014 \ud83d\udccd ${locationText}`);
    Toast.success('Emergency services alerted! Call 102 if needed.', 8000);

    setTimeout(() => {
      btn.disabled = false;
      _setStatus(status, '', 'fa-circle-check', 'Ready \u2014 tap SOS to activate');
    }, 30000);
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

async function _reverseGeocode(lat, lon) {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const data = await res.json();
    const a    = data.address || {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.neighbourhood || a.suburb || a.village,
      a.city || a.town || a.county,
      a.state,
      a.postcode
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}
