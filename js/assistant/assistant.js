/**
 * AI Assistant Module
 * Emergency Healthcare AI Platform
 */

import { sanitize } from '../utils/helpers.js';
import Toast from '../components/toast.js';

const CONDITIONS = [
  { id:1, name:'Common Cold',    cat:'respiratory',  icon:'fa-head-side-cough', desc:'Viral upper respiratory tract infection.' },
  { id:2, name:'Influenza',      cat:'respiratory',  icon:'fa-lungs-virus',     desc:'Contagious respiratory illness from flu viruses.' },
  { id:3, name:'Asthma',         cat:'respiratory',  icon:'fa-wind',            desc:'Chronic inflammatory disease of the airways.' },
  { id:4, name:'Food Poisoning', cat:'digestive',    icon:'fa-utensils',        desc:'Illness caused by contaminated food or water.' },
  { id:5, name:'Heartburn',      cat:'digestive',    icon:'fa-fire',            desc:'Burning sensation from acid reflux.' },
  { id:6, name:'Migraine',       cat:'neurological', icon:'fa-brain',           desc:'Recurrent severe headache disorder.' },
  { id:7, name:'Eczema',         cat:'skin',         icon:'fa-allergies',       desc:'Condition causing inflamed, itchy skin.' },
  { id:8, name:'Conjunctivitis', cat:'skin',         icon:'fa-eye',             desc:'Inflammation of the outer eyelid membrane.' },
];

const GUIDES = {
  cpr: {
    title: 'CPR (Cardiopulmonary Resuscitation)',
    video: 'https://www.youtube.com/embed/0dcmfqzuXDI',
    steps: [
      'Check the scene for safety and the person for responsiveness.',
      'Call emergency services (102) or ask someone to call.',
      'Place the person on their back on a firm, flat surface.',
      'Place the heel of one hand on the center of the chest.',
      'Place the other hand on top and interlock fingers.',
      'Push hard and fast — 2 inches deep at 100–120 compressions per minute.',
      'After 30 compressions, give 2 rescue breaths if trained.',
      'Continue until help arrives or the person shows signs of life.',
    ],
    note: 'For adults and children over puberty. Use one hand for small children and two fingers for infants.',
  },
  choking: {
    title: 'Heimlich Maneuver for Choking',
    video: 'https://www.youtube.com/embed/7CgtIgSyAiU',
    steps: [
      'Ask "Are you choking?" — if they cannot speak or cough, act immediately.',
      'Stand behind the person and wrap your arms around their waist.',
      'Make a fist with one hand and place it just above the navel.',
      'Grasp your fist with your other hand.',
      'Give quick, firm upward thrusts into the abdomen.',
      'Repeat until the object is expelled or the person loses consciousness.',
      'If unconscious, begin CPR and call 102.',
    ],
    note: 'Use chest thrusts instead for pregnant or obese individuals.',
  },
  burns: {
    title: 'Burn Treatment',
    video: 'https://www.youtube.com/embed/K42EFY2KXjM',
    steps: [
      'Cool the burn with cool (not cold) running water for 10–20 minutes.',
      'Remove jewelry or tight clothing near the burned area.',
      'Do NOT break blisters or apply butter, toothpaste, or ice.',
      'Cover loosely with a sterile, non-stick bandage.',
      'Take over-the-counter pain reliever if needed.',
      'Seek medical help for burns larger than 3 inches or on face/hands/joints.',
    ],
    note: 'For chemical burns, remove contaminated clothing and rinse with water for 20+ minutes.',
  },
};

document.addEventListener('DOMContentLoaded', () => {
  _initTabs();
  _initSymptomTags();
  _initTextAnalysis();
  _initVoice();
  _initImageUpload();
  _initGuideModal();
  _initConditions();
});

// ── Tabs ─────────────────────────────────────────
function _initTabs() {
  document.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.method-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.method-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      document.getElementById(`pane-${tab.dataset.method}`)?.classList.add('active');
    });
  });
}

// ── Symptom Tags ─────────────────────────────────
function _initSymptomTags() {
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const text = tag.textContent;
      const ta   = document.getElementById('symptomText');
      tag.classList.toggle('selected');
      if (tag.classList.contains('selected')) {
        ta.value = (ta.value + ' ' + text).trim();
      } else {
        ta.value = ta.value.replace(text, '').replace(/\s+/g, ' ').trim();
      }
    });
    tag.addEventListener('keydown', e => { if (e.key === 'Enter') tag.click(); });
  });
}

// ── Text Analysis ────────────────────────────────
function _initTextAnalysis() {
  document.getElementById('analyzeBtn')?.addEventListener('click', () => {
    const symptoms = document.getElementById('symptomText')?.value.trim();
    if (!symptoms) { Toast.warning('Please describe your symptoms first.'); return; }
    _showLoading();
    setTimeout(() => _showResults(_analyze(symptoms), symptoms), 1200 + Math.random() * 600);
  });
}

// ── Voice ────────────────────────────────────────
function _initVoice() {
  const btn        = document.getElementById('voiceBtn');
  const status     = document.getElementById('voiceStatus');
  const transcript = document.getElementById('voiceTranscript');
  const analyzeBtn = document.getElementById('analyzeVoiceBtn');
  if (!btn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.disabled = true;
    if (status) status.textContent = 'Voice not supported. Use text input instead.';
    return;
  }

  // Check if we're on a context where speech is allowed
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isSecure) {
    btn.disabled = true;
    if (status) status.textContent = 'Voice requires HTTPS. Use text input instead.';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let recording = false;

  btn.addEventListener('click', () => {
    if (!recording) {
      recognition.start();
      recording = true;
      btn.classList.add('recording');
      btn.innerHTML = '<i class="fas fa-stop"></i>';
      status.textContent = 'Listening... speak now';
      transcript.textContent = '';
    } else {
      recognition.stop();
    }
  });

  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    transcript.textContent = text;
    document.getElementById('symptomText').value = text;
    analyzeBtn.disabled = false;
  };

  recognition.onend = () => {
    recording = false;
    btn.classList.remove('recording');
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    status.textContent = 'Recording stopped';
  };

  recognition.onerror = e => {
    recording = false;
    btn.classList.remove('recording');
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      status.textContent = 'Microphone access denied. Please allow mic in browser settings.';
      Toast.error('Allow microphone access in your browser to use voice input.');
    } else if (e.error === 'no-speech') {
      status.textContent = 'No speech detected. Try again.';
    } else {
      status.textContent = 'Voice unavailable. Please use text input instead.';
    }
  };

  analyzeBtn?.addEventListener('click', () => {
    const text = transcript.textContent;
    if (!text) return;
    _showLoading();
    setTimeout(() => _showResults(_analyze(text), text), 1200);
  });
}

// ── Image Upload ─────────────────────────────────
function _initImageUpload() {
  const area       = document.getElementById('uploadArea');
  const input      = document.getElementById('imageInput');
  const preview    = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeBtn  = document.getElementById('removeImageBtn');
  const analyzeBtn = document.getElementById('analyzeImageBtn');
  if (!area) return;

  area.addEventListener('click', () => input.click());
  area.addEventListener('keydown', e => { if (e.key === 'Enter') input.click(); });

  ['dragover','dragenter'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.remove('dragover'); }));
  area.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) _loadImage(f); });

  input.addEventListener('change', e => { if (e.target.files[0]) _loadImage(e.target.files[0]); });

  function _loadImage(file) {
    if (!file.type.startsWith('image/')) { Toast.error('Please upload an image file.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      previewImg.src = ev.target.result;
      area.style.display = 'none';
      preview.style.display = 'block';
      analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  removeBtn?.addEventListener('click', () => {
    previewImg.src = '';
    input.value = '';
    area.style.display = '';
    preview.style.display = 'none';
    analyzeBtn.disabled = true;
  });

  analyzeBtn?.addEventListener('click', () => {
    _showLoading();
    setTimeout(() => _showImageResults(), 1800);
  });
}

// ── Guide Modal ──────────────────────────────────
function _initGuideModal() {
  document.querySelectorAll('.view-guide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const guide = GUIDES[btn.dataset.guide];
      if (!guide) return;
      document.getElementById('guideModalTitle').textContent = guide.title;
      document.getElementById('guideModalBody').innerHTML = `
        <div class="modal-video"><iframe src="${guide.video}" allowfullscreen loading="lazy"></iframe></div>
        <div class="modal-steps"><h3 style="margin-bottom:var(--space-4)">Steps</h3><ol>${guide.steps.map(s => `<li>${sanitize(s)}</li>`).join('')}</ol></div>
        <div class="modal-note"><i class="fas fa-triangle-exclamation" style="color:var(--color-warning);margin-right:var(--space-2)"></i>${sanitize(guide.note)}</div>`;
      document.getElementById('guideModal').classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  document.getElementById('closeGuideModal')?.addEventListener('click', _closeModal);
  document.getElementById('guideModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('guideModal')) _closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') _closeModal(); });
}

function _closeModal() {
  document.getElementById('guideModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Conditions ───────────────────────────────────
function _initConditions() {
  _renderConditions('all');
  document.querySelectorAll('.condition-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.condition-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _renderConditions(tab.dataset.cat);
    });
  });
}

function _renderConditions(cat) {
  const grid = document.getElementById('conditionsGrid');
  if (!grid) return;
  const filtered = cat === 'all' ? CONDITIONS : CONDITIONS.filter(c => c.cat === cat);
  grid.innerHTML = filtered.map(c => `
    <div class="condition-card" tabindex="0" role="button" aria-label="${c.name}">
      <i class="fas ${c.icon}"></i>
      <h4>${c.name}</h4>
      <p>${c.desc}</p>
    </div>`).join('');
}

// ── AI Analysis Engine ───────────────────────────
function _analyze(symptoms) {
  const s = symptoms.toLowerCase();
  if ((s.includes('chest pain') || s.includes('chest pressure')) && (s.includes('breath') || s.includes('sweat'))) {
    return { severity:'high', conditions:[{ name:'Possible Cardiac Event', prob:'Emergency', desc:'Symptoms suggest a possible heart attack requiring immediate attention.' }], advice:'Call 102 immediately. Chew aspirin (325mg) if not allergic. Rest and stay calm.' };
  }
  if (s.includes('fever') && s.includes('cough')) {
    return { severity:'moderate', conditions:[{ name:'Influenza (Flu)', prob:'Likely', desc:'Viral infection causing fever, cough, and body aches.' },{ name:'COVID-19', prob:'Possible', desc:'Respiratory illness with similar symptoms to flu.' }], advice:'Rest, stay hydrated, take fever reducers. Isolate and get tested if possible.' };
  }
  if (s.includes('rash') || s.includes('itch')) {
    return { severity:'low', conditions:[{ name:'Allergic Reaction', prob:'Likely', desc:'Skin reaction to allergens.' },{ name:'Eczema', prob:'Possible', desc:'Chronic condition causing itchy, inflamed skin.' }], advice:'Apply cool compresses and hydrocortisone cream. Take antihistamines for itching.' };
  }
  if (s.includes('headache') && s.includes('nausea')) {
    return { severity:'moderate', conditions:[{ name:'Migraine', prob:'Likely', desc:'Severe recurrent headache often with nausea.' }], advice:'Rest in a dark, quiet room. Stay hydrated. Take pain relievers if not contraindicated.' };
  }
  return { severity:'low', conditions:[{ name:'Multiple Possible Causes', prob:'Varies', desc:'Your symptoms could indicate several conditions.' }], advice:'Monitor your symptoms. If they worsen or persist beyond 48 hours, consult a healthcare provider.' };
}

function _showLoading() {
  document.getElementById('resultsBody').innerHTML = `
    <div class="loading-state">
      <div class="ai-avatar-sm"><i class="fas fa-robot"></i></div>
      <div>
        <p style="font-size:var(--text-sm);font-weight:var(--font-semibold);margin-bottom:var(--space-2)">Analyzing your symptoms...</p>
        <div class="loading-dots"><span></span><span></span><span></span></div>
      </div>
    </div>`;
}

function _showResults(r, symptoms) {
  const sevMap = { high:['high','fa-triangle-exclamation','Seek Immediate Medical Attention'], moderate:['moderate','fa-circle-info','Consult a Healthcare Provider'], low:['low','fa-circle-check','Monitor Your Condition'] };
  const [cls, icon, label] = sevMap[r.severity] || sevMap.low;

  document.getElementById('resultsBody').innerHTML = `
    <div class="severity-banner ${cls}"><i class="fas ${icon}"></i> ${label}</div>
    <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-4)">"${sanitize(symptoms)}"</p>
    <h5 style="font-size:var(--text-sm);margin-bottom:var(--space-3)">Possible Conditions</h5>
    ${r.conditions.map(c => `
      <div class="condition-item">
        <div class="condition-item-header">
          <span class="condition-item-name">${sanitize(c.name)}</span>
          <span class="badge badge-${c.prob === 'Emergency' ? 'danger' : c.prob === 'Likely' ? 'warning' : 'info'}">${sanitize(c.prob)}</span>
        </div>
        <p>${sanitize(c.desc)}</p>
      </div>`).join('')}
    <div class="advice-box">
      <h5><i class="fas fa-lightbulb"></i> Recommendations</h5>
      <p>${sanitize(r.advice)}</p>
    </div>
    <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-4)">
      <a href="emergency.html" class="btn btn-primary btn-sm"><i class="fas fa-truck-medical"></i> Emergency Help</a>
      <a href="hospitals.html" class="btn btn-ghost btn-sm"><i class="fas fa-hospital"></i> Find Hospitals</a>
    </div>
    <div class="disclaimer"><i class="fas fa-triangle-exclamation"></i><span>This is not a medical diagnosis. Always consult a qualified healthcare professional.</span></div>`;
}

function _showImageResults() {
  document.getElementById('resultsBody').innerHTML = `
    <div class="severity-banner low"><i class="fas fa-circle-check"></i> Analysis Complete</div>
    <div class="condition-item">
      <div class="condition-item-header">
        <span class="condition-item-name">Possible Skin Condition</span>
        <span class="badge badge-warning">Moderate</span>
      </div>
      <p>The image suggests a possible skin reaction. Please consult a dermatologist for accurate diagnosis.</p>
    </div>
    <div class="advice-box">
      <h5><i class="fas fa-lightbulb"></i> Recommendations</h5>
      <p>Keep the area clean and dry. Avoid scratching. Apply a gentle moisturizer. See a doctor if it worsens.</p>
    </div>
    <div class="disclaimer"><i class="fas fa-triangle-exclamation"></i><span>Image analysis is not a substitute for professional medical diagnosis.</span></div>`;
}
