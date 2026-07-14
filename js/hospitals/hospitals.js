/**
 * Hospitals Page Module
 * Emergency Healthcare AI Platform
 */

import { haversineDistance, formatDistance, getCurrentPosition, debounce } from '../utils/helpers.js';
import Toast from '../components/toast.js';
import AppConfig from '../config/app.config.js';

// Inline data — no fetch needed, works on file:// and any server
const HOSPITALS_DATA = [
  { id:1, name:'PSG Hospitals', address:'Peelamedu, Coimbatore - 641004', rating:4.8, waitTime:20, specialties:['emergency','cardiology','neurology','orthopedics'], phone:'+91 422 2570170', lat:11.0186, lng:77.0199, beds:1200, bedsAvailable:45, type:'Multi-Specialty' },
  { id:2, name:'Kovai Medical Center (KMCH)', address:'Avanashi Road, Coimbatore - 641014', rating:4.7, waitTime:35, specialties:['emergency','pediatrics','oncology','cardiology'], phone:'+91 422 4323800', lat:11.0274, lng:77.0262, beds:800, bedsAvailable:22, type:'Multi-Specialty' },
  { id:3, name:'G. Kuppuswamy Naidu Memorial Hospital', address:'Pappanaickenpalayam, Coimbatore - 641037', rating:4.5, waitTime:45, specialties:['emergency','general surgery','urology','ophthalmology'], phone:'+91 422 2245000', lat:11.0025, lng:77.0089, beds:600, bedsAvailable:18, type:'General' },
  { id:4, name:'Sri Ramakrishna Hospital', address:'395, Sarojini Naidu Road, Coimbatore - 641044', rating:4.6, waitTime:30, specialties:['emergency','pediatrics','dermatology','ENT'], phone:'+91 422 4500000', lat:11.0039, lng:76.9618, beds:500, bedsAvailable:31, type:'Multi-Specialty' },
  { id:5, name:'Aravind Eye Hospital', address:'Avanishi Road, Coimbatore - 641014', rating:4.9, waitTime:15, specialties:['ophthalmology'], phone:'+91 422 4365000', lat:11.0356, lng:77.0372, beds:200, bedsAvailable:12, type:'Specialty' },
];

let map, markers = [], currentLocation = null, currentMarker = null;
let hospitals = [], activeSort = 'distance';

document.addEventListener('DOMContentLoaded', () => {
  _initMap();
  hospitals = HOSPITALS_DATA;
  _renderList(hospitals);
  _bindControls();
});

function _initMap() {
  if (typeof L === 'undefined') { console.warn('Leaflet not loaded'); return; }
  map = L.map('hospital-map').setView(
    [AppConfig.map.defaultCenter.lat, AppConfig.map.defaultCenter.lng],
    AppConfig.map.defaultZoom
  );
  L.tileLayer(AppConfig.map.tileUrl, { attribution: AppConfig.map.attribution }).addTo(map);
}

function _renderList(data) {
  const list  = document.getElementById('hospitalList');
  const count = document.getElementById('resultCount');
  if (!list) return;

  if (count) count.textContent = `${data.length} hospital${data.length !== 1 ? 's' : ''} found`;

  if (map) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
  }

  if (!data.length) {
    list.innerHTML = `<div style="padding:2rem;text-align:center;color:#778da9"><i class="fas fa-hospital" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.3"></i><p>No hospitals found. Try adjusting your filters.</p></div>`;
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

  if (map) {
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
  }

  list.querySelectorAll('.location-card').forEach((card, i) => {
    const activate = () => {
      list.querySelectorAll('.location-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      if (map) { map.setView([data[i].lat, data[i].lng], 15); markers[i]?.openPopup(); }
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') activate(); });
  });

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

function _bindControls() {
  document.getElementById('searchBtn')?.addEventListener('click', _filter);
  document.getElementById('locationInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') _filter(); });

  document.getElementById('currentLocationBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('currentLocationBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
      const pos = await getCurrentPosition();
      currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      if (map) {
        if (currentMarker) map.removeLayer(currentMarker);
        currentMarker = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: L.divIcon({ className: '', html: '<i class="fas fa-location-dot" style="color:#e63946;font-size:24px;"></i>', iconSize: [24, 24], iconAnchor: [12, 24] })
        }).addTo(map).bindPopup('Your location');
        map.setView([currentLocation.lat, currentLocation.lng], 13);
      }

      document.getElementById('locationInput').value = 'Current Location';
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
