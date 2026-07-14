/**
 * Blood Bank Page Module
 * Emergency Healthcare AI Platform
 */

import { haversineDistance, formatDistance, getCurrentPosition } from '../utils/helpers.js';
import Toast from '../components/toast.js';
import AppConfig from '../config/app.config.js';

// Inline data — no fetch needed, works on file:// and any server
const BLOODBANKS_DATA = [
  { id:1, name:'PSG Blood Bank', address:'PSG Hospitals, Peelamedu, Coimbatore - 641004', rating:4.8, phone:'+91 422 2570170', lat:11.0186, lng:77.0199, bloodTypes:{'A+':'available','A-':'limited','B+':'available','B-':'critical','AB+':'available','AB-':'limited','O+':'critical','O-':'limited'} },
  { id:2, name:'KMCH Blood Bank', address:'Kovai Medical Center, Avanashi Road, Coimbatore - 641014', rating:4.7, phone:'+91 422 4323800', lat:11.0274, lng:77.0262, bloodTypes:{'A+':'available','A-':'critical','B+':'available','B-':'limited','AB+':'limited','AB-':'critical','O+':'critical','O-':'critical'} },
  { id:3, name:'Government Blood Bank', address:'Coimbatore Medical College, Coimbatore - 641018', rating:4.3, phone:'+91 422 2245000', lat:11.0025, lng:77.0089, bloodTypes:{'A+':'limited','A-':'limited','B+':'available','B-':'limited','AB+':'critical','AB-':'critical','O+':'available','O-':'limited'} },
  { id:4, name:'Rotary Blood Bank', address:'RS Puram, Coimbatore - 641002', rating:4.6, phone:'+91 422 2388888', lat:11.0039, lng:76.9618, bloodTypes:{'A+':'available','A-':'available','B+':'available','B-':'limited','AB+':'available','AB-':'limited','O+':'available','O-':'limited'} },
  { id:5, name:'Lions Blood Bank', address:'Gandhipuram, Coimbatore - 641012', rating:4.5, phone:'+91 422 2498888', lat:11.0356, lng:77.0372, bloodTypes:{'A+':'available','A-':'limited','B+':'critical','B-':'critical','AB+':'limited','AB-':'critical','O+':'available','O-':'critical'} },
];

let map, markers = [], currentLocation = null, currentMarker = null;
let bloodBanks = [], activeSort = 'distance', selectedType = '';

document.addEventListener('DOMContentLoaded', () => {
  _initMap();
  bloodBanks = BLOODBANKS_DATA;
  _renderBloodTypeGrid();
  _filter();
  _bindControls();
});

function _initMap() {
  if (typeof L === 'undefined') { console.warn('Leaflet not loaded'); return; }
  map = L.map('bloodbank-map').setView(
    [AppConfig.map.defaultCenter.lat, AppConfig.map.defaultCenter.lng],
    AppConfig.map.defaultZoom
  );
  L.tileLayer(AppConfig.map.tileUrl, { attribution: AppConfig.map.attribution }).addTo(map);
}

function _renderBloodTypeGrid() {
  const grid = document.getElementById('bloodTypesGrid');
  if (!grid) return;

  const types = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const agg = {};
  types.forEach(t => {
    const statuses = bloodBanks.map(b => b.bloodTypes[t]);
    if (statuses.includes('available'))    agg[t] = 'available';
    else if (statuses.includes('limited')) agg[t] = 'limited';
    else                                   agg[t] = 'critical';
  });

  grid.innerHTML = types.map(t => `
    <div class="blood-type-chip${selectedType === t ? ' selected' : ''}" data-type="${t}" role="button" tabindex="0" aria-label="${t} blood type: ${agg[t]}">
      <span class="bt-label">${t}</span>
      <span class="bt-status ${agg[t]}">${agg[t]}</span>
    </div>`).join('');

  grid.querySelectorAll('.blood-type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.type;
      selectedType = selectedType === type ? '' : type;
      const sel = document.getElementById('bloodTypeFilter');
      if (sel) sel.value = selectedType;
      _renderBloodTypeGrid();
      _filter();
    });
  });
}

function _renderList(data) {
  const list  = document.getElementById('bloodbankList');
  const count = document.getElementById('resultCount');
  if (!list) return;

  if (count) count.textContent = `${data.length} blood bank${data.length !== 1 ? 's' : ''} found`;

  if (map) { markers.forEach(m => map.removeLayer(m)); markers = []; }

  if (!data.length) {
    list.innerHTML = `<div style="padding:2rem;text-align:center;color:#778da9"><i class="fas fa-droplet" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.3"></i><p>No blood banks found. Try adjusting your filters.</p></div>`;
    return;
  }

  list.innerHTML = data.map(b => {
    const dist  = currentLocation ? haversineDistance(currentLocation.lat, currentLocation.lng, b.lat, b.lng) : null;
    const avail = selectedType ? b.bloodTypes[selectedType] : _overallStatus(b);
    return `
      <div class="location-card" data-id="${b.id}" tabindex="0" role="button" aria-label="${b.name}">
        <div class="card-top">
          <div>
            <div class="card-name">${b.name}</div>
            <div class="card-distance"><i class="fas fa-location-dot"></i> ${formatDistance(dist)}</div>
          </div>
          <div class="card-rating"><i class="fas fa-star"></i> ${b.rating}</div>
        </div>
        <div class="card-meta">
          <div class="meta-item"><i class="fas fa-map-marker-alt"></i> ${b.address}</div>
          <div class="meta-item"><i class="fas fa-phone"></i> ${b.phone}</div>
          <div class="meta-item"><i class="fas fa-droplet"></i>
            <span class="wait-badge ${avail === 'available' ? 'low' : avail === 'limited' ? 'medium' : 'high'}">${avail.charAt(0).toUpperCase() + avail.slice(1)}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-outline btn-sm btn-directions" data-id="${b.id}"><i class="fas fa-diamond-turn-right"></i> Directions</button>
          <a href="tel:${b.phone}" class="btn btn-ghost btn-sm"><i class="fas fa-phone"></i> Call</a>
          <button class="btn btn-primary btn-sm btn-request" data-id="${b.id}"><i class="fas fa-hand-holding-heart"></i> Request</button>
        </div>
      </div>`;
  }).join('');

  if (map) {
    data.forEach(b => {
      const marker = L.marker([b.lat, b.lng]).addTo(map)
        .bindPopup(`<strong>${b.name}</strong><br>${b.address}`);
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
      const b = bloodBanks.find(x => x.id === parseInt(btn.dataset.id));
      if (!b) return;
      const origin = currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : '';
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${b.lat},${b.lng}&travelmode=driving`
        : `https://www.google.com/maps?q=${b.lat},${b.lng}`;
      window.open(url, '_blank', 'noopener');
    });
  });

  list.querySelectorAll('.btn-request').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const b = bloodBanks.find(x => x.id === parseInt(btn.dataset.id));
      if (b) _openRequestModal(b);
    });
  });
}

function _overallStatus(b) {
  const vals = Object.values(b.bloodTypes);
  if (vals.filter(v => v === 'available').length >= vals.length / 2) return 'available';
  if (vals.some(v => v === 'available' || v === 'limited')) return 'limited';
  return 'critical';
}

function _filter() {
  const bloodType = document.getElementById('bloodTypeFilter')?.value || '';
  const maxDist   = parseInt(document.getElementById('distanceFilter')?.value || '50');
  const query     = document.getElementById('locationInput')?.value.toLowerCase() || '';

  selectedType = bloodType;
  let result = [...bloodBanks];

  if (currentLocation) {
    result = result.filter(b =>
      haversineDistance(currentLocation.lat, currentLocation.lng, b.lat, b.lng) <= maxDist
    );
  }

  if (query && query !== 'current location') {
    result = result.filter(b =>
      b.name.toLowerCase().includes(query) || b.address.toLowerCase().includes(query)
    );
  }

  if (bloodType) {
    result = result.filter(b => b.bloodTypes[bloodType] !== 'critical');
  }

  if (activeSort === 'distance' && currentLocation) {
    result.sort((a, b) =>
      haversineDistance(currentLocation.lat, currentLocation.lng, a.lat, a.lng) -
      haversineDistance(currentLocation.lat, currentLocation.lng, b.lat, b.lng)
    );
  } else if (activeSort === 'availability') {
    const order = { available: 0, limited: 1, critical: 2 };
    result.sort((a, b) => order[_overallStatus(a)] - order[_overallStatus(b)]);
  } else if (activeSort === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  }

  _renderList(result);
}

function _bindControls() {
  document.getElementById('searchBtn')?.addEventListener('click', _filter);

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
      Toast.error('Could not get location.');
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

  document.getElementById('closeRequestModal')?.addEventListener('click', _closeRequestModal);
  document.getElementById('requestModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('requestModal')) _closeRequestModal();
  });
  document.getElementById('bloodRequestForm')?.addEventListener('submit', e => {
    e.preventDefault();
    Toast.success('Blood request submitted successfully!');
    _closeRequestModal();
  });
}

function _openRequestModal(bank) {
  const modal = document.getElementById('requestModal');
  const title = document.getElementById('requestModalTitle');
  if (title) title.textContent = `Request Blood — ${bank.name}`;
  if (selectedType) {
    const sel = document.getElementById('requestBloodType');
    if (sel) sel.value = selectedType;
  }
  modal?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _closeRequestModal() {
  document.getElementById('requestModal')?.classList.remove('open');
  document.body.style.overflow = '';
}
