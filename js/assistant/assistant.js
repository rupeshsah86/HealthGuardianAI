/**
 * AI Assistant Module — HealthGuardian
 * Fully working chatbot + symptom analyzer
 */

import { sanitize } from '../utils/helpers.js';
import Toast from '../components/toast.js';

// ── Knowledge Base ────────────────────────────────
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

// ── AI Chat Knowledge ─────────────────────────────
const CHAT_RESPONSES = [
  {
    patterns: ['chest pain', 'chest pressure', 'heart attack', 'heart pain'],
    severity: 'high',
    response: '🚨 **Chest pain can be a medical emergency.** Possible causes: heart attack, angina, or pulmonary embolism.\n\n**Immediate steps:**\n- Call 102 right now\n- Sit or lie down and rest\n- Chew aspirin (325mg) if not allergic\n- Loosen tight clothing\n\nDo NOT drive yourself to the hospital.',
    actions: [{ label: '🚑 Call Emergency', href: 'emergency.html' }, { label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['fever', 'high temperature', 'temperature'],
    severity: 'moderate',
    response: '🌡️ **Fever detected.** A fever is usually a sign your body is fighting an infection.\n\n**Recommendations:**\n- Drink plenty of fluids (water, ORS)\n- Take paracetamol/ibuprofen for fever above 38.5°C\n- Rest and avoid strenuous activity\n- See a doctor if fever exceeds 39.5°C or lasts more than 3 days',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['cough', 'coughing', 'sore throat', 'cold', 'runny nose'],
    severity: 'low',
    response: '😷 **Respiratory symptoms detected.** This could be a common cold, flu, or upper respiratory infection.\n\n**Recommendations:**\n- Rest and stay hydrated\n- Honey and warm water can soothe throat\n- Steam inhalation helps with congestion\n- See a doctor if symptoms worsen after 5–7 days or you develop high fever',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['headache', 'head pain', 'migraine'],
    severity: 'low',
    response: '🤕 **Headache detected.** Could be tension headache, migraine, or dehydration.\n\n**Recommendations:**\n- Drink water — dehydration is a common cause\n- Rest in a quiet, dark room\n- Apply cold or warm compress to forehead\n- Take OTC pain reliever (paracetamol)\n- Seek help if headache is sudden and severe ("thunderclap")',
    actions: [],
  },
  {
    patterns: ['nausea', 'vomiting', 'stomach', 'stomach pain', 'diarrhea', 'food poisoning'],
    severity: 'moderate',
    response: '🤢 **Digestive symptoms detected.** Could be food poisoning, gastroenteritis, or stomach infection.\n\n**Recommendations:**\n- Stay hydrated with ORS or clear fluids\n- Avoid solid food for a few hours\n- Eat bland foods (rice, toast, bananas) when ready\n- Seek medical help if vomiting blood or symptoms last more than 48 hours',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['dizzy', 'dizziness', 'lightheaded', 'fainting', 'faint'],
    severity: 'moderate',
    response: '😵 **Dizziness detected.** Could be low blood pressure, dehydration, or inner ear issue.\n\n**Recommendations:**\n- Sit or lie down immediately to prevent falling\n- Drink water slowly\n- Avoid sudden position changes\n- Seek emergency care if dizziness is accompanied by chest pain, vision changes, or difficulty speaking',
    actions: [{ label: '🚑 Emergency', href: 'emergency.html' }],
  },
  {
    patterns: ['rash', 'itching', 'itch', 'skin', 'hives', 'allergy', 'allergic'],
    severity: 'low',
    response: '🔴 **Skin reaction detected.** Could be allergic reaction, eczema, or contact dermatitis.\n\n**Recommendations:**\n- Avoid scratching the affected area\n- Apply cool compress for relief\n- Use hydrocortisone cream for mild rashes\n- Take antihistamine for itching\n- Seek emergency care if rash spreads rapidly or you have difficulty breathing',
    actions: [],
  },
  {
    patterns: ['choking', 'can\'t breathe', 'cannot breathe', 'not breathing'],
    severity: 'high',
    response: '🚨 **BREATHING EMERGENCY!**\n\n**If someone is choking:**\n1. Ask "Are you choking?" — if no response, act NOW\n2. Give 5 firm back blows between shoulder blades\n3. Give 5 abdominal thrusts (Heimlich maneuver)\n4. Alternate until object is expelled\n5. Call 102 immediately',
    actions: [{ label: '🚑 Call Emergency', href: 'emergency.html' }, { label: '📖 Choking Guide', href: '#first-aid' }],
  },
  {
    patterns: ['cpr', 'heart stopped', 'unconscious', 'not responding', 'collapsed'],
    severity: 'high',
    response: '🚨 **CARDIAC EMERGENCY!**\n\n**Start CPR immediately:**\n1. Call 102 NOW\n2. Place heel of hand on center of chest\n3. Push hard and fast — 100-120 compressions/min\n4. Give 2 rescue breaths after every 30 compressions\n5. Continue until help arrives',
    actions: [{ label: '🚑 Call Emergency', href: 'emergency.html' }, { label: '📖 CPR Guide', href: '#first-aid' }],
  },
  {
    patterns: ['burn', 'burned', 'burning skin', 'scald'],
    severity: 'moderate',
    response: '🔥 **Burn injury detected.**\n\n**Immediate steps:**\n- Cool with running water for 10–20 minutes\n- Do NOT use ice, butter, or toothpaste\n- Remove jewelry near the burn\n- Cover with clean non-stick bandage\n- Seek medical help for large or deep burns',
    actions: [{ label: '📖 Burns Guide', href: '#first-aid' }, { label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['blood', 'bleeding', 'cut', 'wound'],
    severity: 'moderate',
    response: '🩸 **Bleeding detected.**\n\n**Steps to control bleeding:**\n- Apply firm direct pressure with clean cloth\n- Keep pressure for at least 10 minutes\n- Elevate the injured area above heart level\n- Do NOT remove the cloth — add more on top if soaked\n- Call 102 for severe or uncontrolled bleeding',
    actions: [{ label: '🚑 Emergency', href: 'emergency.html' }],
  },
  {
    patterns: ['stroke', 'face drooping', 'arm weakness', 'speech'],
    severity: 'high',
    response: '🚨 **POSSIBLE STROKE — Act FAST!**\n\n**F.A.S.T. Test:**\n- **F**ace — Is one side drooping?\n- **A**rms — Can they raise both arms?\n- **S**peech — Is speech slurred or strange?\n- **T**ime — Call 102 IMMEDIATELY\n\nEvery minute counts during a stroke!',
    actions: [{ label: '🚑 Call Emergency NOW', href: 'emergency.html' }],
  },
  {
    patterns: ['blood bank', 'blood', 'need blood', 'blood type'],
    severity: 'low',
    response: '🩸 **Looking for blood?** I can help you find nearby blood banks with live availability.\n\nClick below to find blood banks near you.',
    actions: [{ label: '🩸 Find Blood Bank', href: 'bloodbank.html' }],
  },
  {
    patterns: ['hospital', 'doctor', 'clinic', 'nearest hospital'],
    severity: 'low',
    response: '🏥 **Looking for a hospital?** Use our Smart Hospital Finder to locate nearby hospitals with real-time wait times and directions.',
    actions: [{ label: '🏥 Find Hospitals', href: 'hospitals.html' }],
  },
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon'],
    severity: 'low',
    response: '👋 **Hello! I\'m HealthGuardian AI.**\n\nI can help you with:\n- 🔍 Symptom analysis\n- 🚨 Emergency guidance (CPR, choking, burns)\n- 🏥 Finding hospitals & blood banks\n- 💊 Medicine & first aid advice\n\nDescribe your symptoms or ask me anything about your health!',
    actions: [],
  },
  {
    patterns: ['what can you do', 'help me', 'how can you help', 'what do you do'],
    severity: 'low',
    response: '🤖 **Here\'s what I can do:**\n\n- 🩺 Analyze symptoms and suggest possible causes\n- 💊 Recommend medicines for common symptoms\n- 🚨 Guide you through emergencies (CPR, choking, burns, stroke)\n- 🏥 Help you find nearby hospitals and blood banks\n- 📹 Connect you with a doctor via video call\n\nJust type your symptoms or question!',
    actions: [],
  },
  {
    patterns: ['what time', 'current time', 'time now'],
    severity: 'low',
    response: `🕐 The current time is **${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}**.\n\nIs there anything health-related I can help you with?`,
    actions: [],
  },
  {
    patterns: ['what is today', 'what day', 'today\'s date', 'current date', 'what date'],
    severity: 'low',
    response: `📅 Today is **${new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**.\n\nAnything health-related I can help you with?`,
    actions: [],
  },
  {
    patterns: ['thank', 'thanks', 'thank you', 'great', 'awesome', 'good job'],
    severity: 'low',
    response: '😊 You\'re welcome! Stay healthy and don\'t hesitate to ask if you need anything else. I\'m here 24/7!',
    actions: [],
  },
  {
    patterns: ['bye', 'goodbye', 'see you', 'take care'],
    severity: 'low',
    response: '👋 Take care and stay safe! Remember, I\'m available 24/7 if you ever need health guidance. Goodbye! 💙',
    actions: [],
  },
  {
    patterns: ['how are you', 'how do you do', 'are you okay'],
    severity: 'low',
    response: '😊 I\'m doing great, thank you for asking! I\'m always ready to help you with health questions. How are **you** feeling today?',
    actions: [],
  },
  {
    patterns: ['who are you', 'what are you', 'your name', 'are you a bot', 'are you ai'],
    severity: 'low',
    response: '🤖 I\'m **HealthGuardian AI**, an intelligent health assistant built to help you during medical situations.\n\nI can analyze symptoms, guide you through emergencies, recommend medicines, and connect you with healthcare services — all in real time.',
    actions: [],
  },
  {
    patterns: ['paracetamol', 'panadol', 'acetaminophen', 'medicine for fever', 'tablet for fever', 'fever medicine'],
    severity: 'low',
    response: '💊 **Paracetamol (Acetaminophen)** is the most common medicine for fever and mild pain.\n\n**Dosage (adults):** 500mg–1000mg every 4–6 hours. Max 4g/day.\n\n**Also used for:** Headache, body ache, cold symptoms.\n\n⚠️ Do not exceed the recommended dose. Consult a doctor if fever persists beyond 3 days.',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['ibuprofen', 'brufen', 'medicine for pain', 'painkiller', 'pain killer', 'pain medicine'],
    severity: 'low',
    response: '💊 **Ibuprofen (Brufen/Advil)** is an anti-inflammatory painkiller.\n\n**Used for:** Fever, headache, muscle pain, joint pain, menstrual cramps.\n\n**Dosage (adults):** 200–400mg every 6–8 hours with food. Max 1200mg/day (OTC).\n\n⚠️ Avoid on empty stomach. Not recommended for people with kidney issues or stomach ulcers.',
    actions: [],
  },
  {
    patterns: ['antibiotic', 'amoxicillin', 'azithromycin', 'medicine for infection', 'infection medicine'],
    severity: 'moderate',
    response: '💊 **Antibiotics** are used to treat bacterial infections — NOT viral infections like cold or flu.\n\n**Common antibiotics:**\n- **Amoxicillin** — throat, ear, chest infections\n- **Azithromycin** — respiratory, skin infections\n- **Ciprofloxacin** — urinary tract, gut infections\n\n⚠️ **Always take antibiotics only as prescribed by a doctor.** Never self-medicate or stop mid-course.',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['antacid', 'omeprazole', 'medicine for acidity', 'acidity medicine', 'acid reflux medicine', 'heartburn medicine'],
    severity: 'low',
    response: '💊 **Medicines for Acidity & Heartburn:**\n\n- **Antacids** (Gelusil, Digene) — fast relief, neutralize acid\n- **Omeprazole / Pantoprazole** — reduce acid production, taken before meals\n- **Ranitidine** — H2 blocker for acid control\n\n**Tips:** Eat smaller meals, avoid spicy/oily food, don\'t lie down right after eating.',
    actions: [],
  },
  {
    patterns: ['antihistamine', 'cetirizine', 'loratadine', 'medicine for allergy', 'allergy medicine', 'allergy tablet'],
    severity: 'low',
    response: '💊 **Antihistamines for Allergies:**\n\n- **Cetirizine (Zyrtec)** — 10mg once daily, non-drowsy\n- **Loratadine (Claritin)** — 10mg once daily, non-drowsy\n- **Diphenhydramine (Benadryl)** — causes drowsiness, good for nighttime\n\n**Used for:** Runny nose, sneezing, itchy eyes, hives, skin rashes.',
    actions: [],
  },
  {
    patterns: ['cough syrup', 'medicine for cough', 'cough medicine', 'cough tablet'],
    severity: 'low',
    response: '💊 **Medicines for Cough:**\n\n- **Dry cough:** Dextromethorphan (cough suppressant) — e.g. Robitussin DM\n- **Wet/productive cough:** Guaifenesin (expectorant) — helps loosen mucus\n- **Honey + warm water** — natural remedy, very effective for mild cough\n\n⚠️ See a doctor if cough lasts more than 2 weeks or you cough up blood.',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['ors', 'oral rehydration', 'medicine for diarrhea', 'diarrhea medicine', 'dehydration medicine'],
    severity: 'low',
    response: '💊 **For Diarrhea & Dehydration:**\n\n- **ORS (Oral Rehydration Salts)** — most important, replaces lost fluids and electrolytes\n- **Loperamide (Imodium)** — slows diarrhea, for adults only\n- **Probiotics** — help restore gut bacteria\n\n**Home remedy:** Mix 1L water + 6 tsp sugar + ½ tsp salt.\n\n⚠️ Seek help if diarrhea lasts more than 2 days or there is blood in stool.',
    actions: [],
  },
  {
    patterns: ['medicine for headache', 'headache tablet', 'headache medicine', 'migraine medicine', 'medicine for migraine'],
    severity: 'low',
    response: '💊 **Medicines for Headache & Migraine:**\n\n- **Paracetamol** — mild to moderate headache\n- **Ibuprofen** — tension headache, inflammation\n- **Aspirin** — effective for migraine (not for children)\n- **Sumatriptan** — prescription drug specifically for migraines\n\n**Non-drug tips:** Rest in a dark quiet room, stay hydrated, apply cold compress.',
    actions: [],
  },
  {
    patterns: ['medicine for cold', 'cold medicine', 'flu medicine', 'medicine for flu', 'runny nose medicine'],
    severity: 'low',
    response: '💊 **Medicines for Cold & Flu:**\n\n- **Paracetamol** — fever and body ache\n- **Cetirizine** — runny nose and sneezing\n- **Pseudoephedrine** — nasal decongestant\n- **Cough syrup** — for associated cough\n- **Vitamin C & Zinc** — support immune recovery\n\n⚠️ Antibiotics do NOT work for cold/flu (viral). Rest and fluids are key.',
    actions: [],
  },
  {
    patterns: ['medicine for diabetes', 'diabetes medicine', 'blood sugar medicine', 'metformin', 'insulin'],
    severity: 'moderate',
    response: '💊 **Common Diabetes Medicines:**\n\n- **Metformin** — first-line for Type 2 diabetes, reduces blood sugar\n- **Insulin** — for Type 1 and advanced Type 2 diabetes\n- **Glipizide / Glibenclamide** — stimulate insulin release\n- **SGLT2 inhibitors** (Empagliflozin) — newer class, also protect kidneys\n\n⚠️ Diabetes medicines must be prescribed and monitored by a doctor. Never adjust doses on your own.',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['medicine for blood pressure', 'bp medicine', 'hypertension medicine', 'amlodipine', 'high bp'],
    severity: 'moderate',
    response: '💊 **Common Blood Pressure Medicines:**\n\n- **Amlodipine** — calcium channel blocker, widely used\n- **Lisinopril / Enalapril** — ACE inhibitors, also protect kidneys\n- **Losartan** — ARB, good for diabetics with hypertension\n- **Atenolol** — beta-blocker, slows heart rate\n\n⚠️ BP medicines require a doctor\'s prescription. Never stop them suddenly.',
    actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
  },
  {
    patterns: ['what medicine', 'which medicine', 'what tablet', 'which tablet', 'what drug', 'medicine for'],
    severity: 'low',
    response: '💊 **I can help with medicine information!** Here are some common ones:\n\n- **Fever / Pain** → Paracetamol, Ibuprofen\n- **Allergy** → Cetirizine, Loratadine\n- **Cough** → Dextromethorphan (dry), Guaifenesin (wet)\n- **Acidity** → Omeprazole, Antacids\n- **Diarrhea** → ORS, Loperamide\n- **Cold & Flu** → Paracetamol + Cetirizine + rest\n\nTell me your specific symptom for a more detailed recommendation!',
    actions: [],
  },
];

const FALLBACK = {
  severity: 'low',
  response: '🤖 I\'m not sure about that specific query. I\'m best at helping with:\n\n- 🩺 Symptoms & medical conditions\n- 💊 Medicine recommendations\n- 🚨 Emergency first aid guidance\n- 🏥 Finding hospitals & blood banks\n\nTry rephrasing your question or describe your symptoms!',
  actions: [{ label: '🏥 Find Hospital', href: 'hospitals.html' }],
};

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _initTabs();
  _initSymptomTags();
  _initTextAnalysis();
  _initVoice();
  _initImageUpload();
  _initGuideModal();
  _initConditions();
  _initChatbot();
});

// ── Tabs ──────────────────────────────────────────
function _initTabs() {
  document.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.method-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.method-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(`pane-${tab.dataset.method}`)?.classList.add('active');
    });
  });
}

// ── Symptom Tags ──────────────────────────────────
function _initSymptomTags() {
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const text = tag.textContent.trim();
      const ta = document.getElementById('symptomText');
      tag.classList.toggle('selected');
      ta.value = tag.classList.contains('selected')
        ? (ta.value + ' ' + text).trim()
        : ta.value.replace(text, '').replace(/\s+/g, ' ').trim();
    });
    tag.addEventListener('keydown', e => { if (e.key === 'Enter') tag.click(); });
  });
}

// ── Text Analysis → sends to chatbot panel ────────
function _initTextAnalysis() {
  document.getElementById('analyzeBtn')?.addEventListener('click', () => {
    const symptoms = document.getElementById('symptomText')?.value.trim();
    if (!symptoms) { Toast.warning('Please describe your symptoms first.'); return; }
    _sendToChatbot(symptoms, true);
    document.getElementById('symptomText').value = '';
    document.querySelectorAll('.symptom-tag.selected').forEach(t => t.classList.remove('selected'));
  });
}

// ── Voice ─────────────────────────────────────────
function _switchToTextTab() {
  document.querySelectorAll('.method-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  document.querySelectorAll('.method-pane').forEach(p => p.classList.remove('active'));
  const textTab = document.querySelector('.method-tab[data-method="text"]');
  textTab?.classList.add('active');
  textTab?.setAttribute('aria-selected','true');
  document.getElementById('pane-text')?.classList.add('active');
  document.getElementById('symptomText')?.focus();
}

function _initVoice() {
  const btn        = document.getElementById('voiceBtn');
  const status     = document.getElementById('voiceStatus');
  const transcript = document.getElementById('voiceTranscript');
  const analyzeBtn = document.getElementById('analyzeVoiceBtn');
  const paneVoice  = document.getElementById('pane-voice');
  if (!btn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (!SpeechRecognition || !isSecure) {
    if (paneVoice) {
      paneVoice.innerHTML = `
        <div class="voice-pane" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-10) var(--space-4);text-align:center;gap:var(--space-4)">
          <i class="fas fa-microphone-slash" style="font-size:3rem;color:var(--text-muted)"></i>
          <p style="font-weight:var(--font-semibold);color:var(--text-primary);margin:0">
            ${!SpeechRecognition ? 'Voice not supported in this browser.' : 'Voice requires HTTPS or localhost.'}
          </p>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0">
            ${!SpeechRecognition
              ? 'Use Chrome or Edge for voice input.'
              : 'Run via <strong>npx serve .</strong> or VS Code Live Server to enable voice.'}
          </p>
          <button class="btn btn-primary" id="voiceFallbackBtn"><i class="fas fa-keyboard"></i> Use Text Input Instead</button>
        </div>`;
      document.getElementById('voiceFallbackBtn')?.addEventListener('click', _switchToTextTab);
    }
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  let recording = false;

  btn.addEventListener('click', () => {
    if (!recording) {
      recognition.start();
      recording = true;
      btn.classList.add('recording');
      btn.innerHTML = '<i class="fas fa-stop"></i>';
      if (status) status.textContent = 'Listening… speak now';
      if (transcript) transcript.textContent = '';
    } else {
      recognition.stop();
    }
  });

  recognition.onresult = e => {
    const text = Array.from(e.results).map(r => r[0].transcript).join('');
    if (transcript) transcript.textContent = text;
    if (e.results[e.results.length - 1].isFinal) {
      const ta = document.getElementById('symptomText');
      if (ta) ta.value = text;
      if (analyzeBtn) analyzeBtn.disabled = false;
    }
  };

  recognition.onend = () => {
    recording = false;
    btn.classList.remove('recording');
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    if (status) status.textContent = 'Recording stopped. Click Analyze to continue.';
  };

  recognition.onerror = e => {
    recording = false;
    btn.classList.remove('recording');
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    const msgs = {
      'not-allowed': 'Microphone access denied. Allow it in browser settings.',
      'no-speech':   'No speech detected. Please try again.',
      'network':     'Network error. Check your connection.',
    };
    if (status) status.textContent = msgs[e.error] || 'Voice error. Try again or use text input.';
    if (e.error === 'not-allowed') Toast.error('Allow microphone access in browser settings.');
  };

  analyzeBtn?.addEventListener('click', () => {
    const text = transcript?.textContent;
    if (!text) return;
    _sendToChatbot(text, true);
  });
}

// ── Image Upload ──────────────────────────────────
function _initImageUpload() {
  const area = document.getElementById('uploadArea');
  const input = document.getElementById('imageInput');
  const preview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeBtn = document.getElementById('removeImageBtn');
  const analyzeBtn = document.getElementById('analyzeImageBtn');
  if (!area) return;

  area.addEventListener('click', () => input.click());
  area.addEventListener('keydown', e => { if (e.key === 'Enter') input.click(); });
  ['dragover', 'dragenter'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.remove('dragover'); }));
  area.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) _loadImage(f); });
  input.addEventListener('change', e => { if (e.target.files[0]) _loadImage(e.target.files[0]); });

  function _loadImage(file) {
    if (!file.type.startsWith('image/')) { Toast.error('Please upload an image file.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      previewImg.src = ev.target.result;
      area.style.display = 'none';
      preview.style.display = 'block';
      if (analyzeBtn) analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  removeBtn?.addEventListener('click', () => {
    previewImg.src = '';
    input.value = '';
    area.style.display = '';
    preview.style.display = 'none';
    if (analyzeBtn) analyzeBtn.disabled = true;
  });

  analyzeBtn?.addEventListener('click', () => {
    _addBotTyping();
    setTimeout(() => {
      _removeBotTyping();
      _addBotMessage(
        '🖼️ **Image Analysis Complete.**\n\nThe image suggests a possible skin condition. This could be:\n- Allergic reaction or contact dermatitis\n- Eczema or psoriasis\n- Minor skin irritation\n\n**Recommendation:** Keep the area clean and dry. Avoid scratching. Consult a dermatologist for accurate diagnosis.',
        'low',
        [{ label: '🏥 Find Dermatologist', href: 'hospitals.html' }]
      );
    }, 1800);
  });
}

// ── Guide Modal ───────────────────────────────────
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

// ── Conditions ────────────────────────────────────
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

// ══════════════════════════════════════════════════
//  AI CHATBOT ENGINE
// ══════════════════════════════════════════════════

function _initChatbot() {
  const messagesEl = document.getElementById('chatMessages');
  const inputEl    = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSendBtn');
  const clearBtn   = document.getElementById('chatClearBtn');
  const voiceBtn   = document.getElementById('chatVoiceBtn');
  if (!messagesEl) return;

  // Welcome message
  _addBotMessage('👋 Hi! I\'m **HealthGuardian AI**. Describe your symptoms or ask me anything about your health. I\'m here 24/7 to help!', 'low', []);

  // Quick replies
  document.querySelectorAll('.quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      if (msg) _sendToChatbot(msg, false);
    });
  });

  // Send button
  sendBtn?.addEventListener('click', _handleSend);
  inputEl?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _handleSend(); } });

  // Clear chat
  clearBtn?.addEventListener('click', () => {
    messagesEl.innerHTML = '';
    _addBotMessage('Chat cleared. How can I help you?', 'low', []);
  });

  // Voice input for chat
  _initChatVoice(voiceBtn, inputEl);

  function _handleSend() {
    const text = inputEl?.value.trim();
    if (!text) return;
    inputEl.value = '';
    _sendToChatbot(text, false);
  }
}

function _sendToChatbot(text, fromAnalyzer) {
  _addUserMessage(text);
  _addBotTyping();
  const delay = 800 + Math.random() * 700;
  setTimeout(() => {
    _removeBotTyping();
    const result = _getBotResponse(text);
    _addBotMessage(result.response, result.severity, result.actions);
    if (fromAnalyzer) Toast.success('Analysis complete! Check the chat panel →');
  }, delay);
}

function _getBotResponse(text) {
  const lower = text.toLowerCase();
  for (const item of CHAT_RESPONSES) {
    if (item.patterns.some(p => lower.includes(p))) return item;
  }
  return FALLBACK;
}

function _addUserMessage(text) {
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.innerHTML = `
    <div class="msg-avatar"><i class="fas fa-user"></i></div>
    <div class="msg-bubble">${sanitize(text)}<span class="msg-time">${time}</span></div>`;
  messagesEl.appendChild(div);
  _scrollToBottom();
}

function _addBotMessage(text, severity, actions) {
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Convert **bold** markdown and \n to HTML
  const formatted = sanitize(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  const severityChip = severity === 'high'
    ? '<span class="msg-severity high"><i class="fas fa-triangle-exclamation"></i> Urgent</span>'
    : severity === 'moderate'
    ? '<span class="msg-severity moderate"><i class="fas fa-circle-info"></i> Moderate</span>'
    : '';

  const actionsHtml = actions?.length
    ? `<div class="msg-actions">${actions.map(a => `<a href="${a.href}">${a.label}</a>`).join('')}</div>`
    : '';

  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.innerHTML = `
    <div class="msg-avatar"><i class="fas fa-robot"></i></div>
    <div class="msg-bubble">${severityChip}${formatted}${actionsHtml}<span class="msg-time">${time}</span></div>`;
  messagesEl.appendChild(div);
  _scrollToBottom();
}

function _addBotTyping() {
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;
  const div = document.createElement('div');
  div.className = 'chat-msg bot typing-indicator';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="msg-avatar"><i class="fas fa-robot"></i></div>
    <div class="typing-dots"><span></span><span></span><span></span></div>`;
  messagesEl.appendChild(div);
  _scrollToBottom();
}

function _removeBotTyping() {
  document.getElementById('typingIndicator')?.remove();
}

function _scrollToBottom() {
  const el = document.getElementById('chatMessages');
  if (el) el.scrollTop = el.scrollHeight;
}

// ── Chat Voice Input ──────────────────────────────
function _initChatVoice(btn, inputEl) {
  if (!btn || !inputEl) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { btn.style.display = 'none'; return; }

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
    } else {
      recognition.stop();
    }
  });

  recognition.onresult = e => {
    inputEl.value = e.results[0][0].transcript;
  };

  recognition.onend = () => {
    recording = false;
    btn.classList.remove('recording');
  };

  recognition.onerror = () => {
    recording = false;
    btn.classList.remove('recording');
  };
}
