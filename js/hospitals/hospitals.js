/**
 * Hospitals Page Module
 * Emergency Healthcare AI Platform
 */

import { haversineDistance, formatDistance, getCurrentPosition, debounce } from '../utils/helpers.js';
import Toast from '../components/toast.js';
import AppConfig from '../config/app.config.js';

let map, markers = [], currentLocation = null, currentMarker = null;
let hospitals = [], activeSort = 'distance';

document.addEventListener('DOMContentLoaded', async () => {
  _initMap();
  hospitals = await _loadHospitals();
  _renderList(hospitals);
  _bindControls();
});

// ── Map Init ────────────────────────────────────
function _initMap() {
  map = L.map('hospital-map').setView(
    [AppConfig.map.defaultCenter.lat, AppConfig.map.defaultCenter.lng],
    AppConfig.map.defaultZoom
  );
  L.tileLayer(AppConfig.map.tileUrl, { attribution: AppConfig.map.attribution }).addTo(map);
}

// ── Load Data ───────────────────────────────────
async function _loadHospitals() {
  try {
    const res = await fetch('../data/hospitals.json');
    return await res.json();
  } catch {
    Toast.error('Could not load hospital data.');
    return [];
  }
}

// ── Render ──────────────────────────────────────
function _renderList(data) {
  const list  = document.getElementById('hospitalList');
  const count = document.getElementById('resultCount');
  if (!list) return;

  count.textContent = `${data.length} hospital${data.length !== 1 ? 's' : ''} found`;

  // Clear old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  if (!data.length) {
    list.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--text-muted)"><i class="fas fa-hospital" style="font-size:2rem;margin-bottom:var(--space-3);display:block;opacity:0.3"></i><p>No hospitals found. Try adjusting your filters.</p></div>`;
    return;
  }

  list.innerHTML = data.map(h => {
    const dist = currentLocation ? haversineDistance(currentLocation.lat, currentLocation.lng, h.lat, h.lng) : null;
    const waitClass = h.waitTime <= 30 ? 'low' : h.waitTime <= 60 ? 'medium' : 'high';
    return `
      <div class="location-card" data-id="${h.id}" tabindex="0" role="button" aria-label="${h.name}">
        <div class="card-top">
          <div>
            <div class="card-name">${h.name}</div>
            <div class="card-distance"><i class="fas fa-location-dot"></i> ${formatDistance(dist)}</div>
          </div>
          <div class="card-rating"><i class="fas fa-star"></i> ${h.rating}</div>
        </div>
        <div class="card-meta">
          <div class="meta-item"><i class="fas fa-map-marker-alt"></i> ${h.address}</div>
          <div class="meta-item"><i class="fas fa-phone"></i> ${h.phone}</div>
          <div class="meta-item"><i class="fas fa-clock"></i>
            <span class="wait-badge ${waitClass}">Wait: ${h.waitTime} min</span>
          </div>
          <div class="meta-item"><i class="fas fa-bed"></i> ${h.bedsAvailable} beds available</div>
        </div>
        <div class="card-actions">
          <button class="btn btn-outline btn-sm btn-directions" data-id="${h.id}"><i class="fas fa-diamond-turn-right"></i> Directions</button>
          <a href="tel:${h.phone}" class="btn btn-ghost btn-sm"><i class="fas fa-phone"></i> Call</a>
        </div>
      </div>`;
  }).join('');

  // Add map markers
  data.forEach(h => {
    const marker = L.marker([h.lat, h.lng])
      .addTo(map)
      .bindPopup(`<strong>${h.name}</strong><br>${h.address}<br>Wait: ${h.waitTime} min`);
    markers.push(marker);
  });

  if (markers.length) {
    const group = L.featureGroup(markers);
    if (currentMarker) group.addLayer(currentMarker);
    map.fitBounds(group.getBounds().pad(0.2));
  }

  // Card click → map focus
  list.querySelectorAll('.location-card').forEach((card, i) => {
    const activate = () => {
      list.querySelectorAll('.location-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      map.setView([data[i].lat, data[i].lng], 15);
      markers[i]?.openPopup();
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') activate(); });
  });

  // Directions buttons
  list.querySelectorAll('.btn-directions').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const h = hospitals.find(x => x.id === parseInt(btn.dataset.id));
      if (!h) return;
      const origin = currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : '';
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${h.lat},${h.lng}&travelmode=driving`
        : `https://www.google.com/maps?q=${h.lat},${h.lng}`;
      window.open(url, '_blank', 'noopener');
    });
  });
}

// ── Filter & Sort ───────────────────────────────
function _filter() {
  const specialty = document.getElementById('specialtyFilter')?.value || '';
  const maxDist   = parseInt(document.getElementById('distanceFilter')?.value || '50');
  const query     = document.getElementById('locationInput')?.value.toLowerCase() || '';

  let result = [...hospitals];

  if (specialty) result = result.filter(h => h.specialties.includes(specialty));

  if (currentLocation) {
    result = result.filter(h =>
      haversineDistance(currentLocation.lat, currentLocation.lng, h.lat, h.lng) <= maxDist
    );
  }

  if (query && query !== 'current location') {
    result = result.filter(h =>
      h.name.toLowerCase().includes(query) || h.address.toLowerCase().includes(query)
    );
  }

  // Sort
  if (activeSort === 'distance' && currentLocation) {
    result.sort((a, b) =>
      haversineDistance(currentLocation.lat, currentLocation.lng, a.lat, a.lng) -
      haversineDistance(currentLocation.lat, currentLocation.lng, b.lat, b.lng)
    );
  } else if (activeSort === 'wait-time') {
    result.sort((a, b) => a.waitTime - b.waitTime);
  } else if (activeSort === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  }

  _renderList(result);
}

// ── Controls ────────────────────────────────────
function _bindControls() {
  document.getElementById('searchBtn')?.addEventListener('click', _filter);
  document.getElementById('locationInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') _filter(); });

  document.getElementById('currentLocationBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('currentLocationBtn');
    btn.innerHTML = '<i class="fas fa-spinner animate-spin"></i>';
    try {
      const pos = await getCurrentPosition();
      currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      if (currentMarker) map.removeLayer(currentMarker);
      currentMarker = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: L.divIcon({ className: '', html: '<i class="fas fa-location-dot" style="color:#e63946;font-size:24px;"></i>', iconSize: [24, 24], iconAnchor: [12, 24] })
      }).addTo(map).bindPopup('Your location');

      document.getElementById('locationInput').value = 'Current Location';
      map.setView([currentLocation.lat, currentLocation.lng], 13);
      _filter();
      Toast.success('Location detected!');
    } catch {
      Toast.error('Could not get location. Please enter it manually.');
    } finally {
      btn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
    }
  });

  document.querySelectorAll('.sort-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeSort = tab.dataset.sort;
      _filter();
    });
  });
}
