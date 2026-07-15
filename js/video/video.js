/**
 * Video Consultation Module
 * Emergency Healthcare AI Platform
 */

import { generateMeetingId, formatDuration, copyToClipboard, sanitize } from '../utils/helpers.js';
import Toast from '../components/toast.js';

// ── State ────────────────────────────────────────
let localStream = null, peer = null, timerInterval = null, elapsed = 0;
let isVideoOn = true, isMicOn = true, isChatOpen = true, isScreenSharing = false;

const DR_RESPONSES = [
  "I understand. Can you describe your symptoms in more detail?",
  "How long have you been experiencing this?",
  "Are you currently taking any medications?",
  "I recommend rest and staying well hydrated.",
  "Based on what you've described, I'll suggest some next steps.",
  "Do you have any known allergies?",
  "Have you experienced this before?",
  "I suggest we schedule a follow-up if symptoms persist.",
];

document.addEventListener('DOMContentLoaded', () => {
  _setupDevices();
  _animateAudioBars();
  _bindPreCallControls();
  _bindCallControls();
  _bindChat();
  document.getElementById('meetingIdDisplay').textContent = generateMeetingId();
});

// ── Device Setup ─────────────────────────────────
async function _setupDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    _showDeviceError('Camera/microphone requires a secure connection (HTTPS or localhost). <a href="https://github.com/" target="_blank">Learn more</a>');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('cameraPreview').srcObject = stream;
    localStream = stream;

    const devices = await navigator.mediaDevices.enumerateDevices();
    _populateSelect('cameraSelect',  devices.filter(d => d.kind === 'videoinput'),  'Camera');
    _populateSelect('micSelect',     devices.filter(d => d.kind === 'audioinput'),  'Microphone');
    _populateSelect('speakerSelect', devices.filter(d => d.kind === 'audiooutput'), 'Speaker');
  } catch (err) {
    const msg = err.name === 'NotAllowedError'
      ? 'Camera/microphone permission denied. Please allow access in your browser settings.'
      : 'Could not access camera/microphone. You can still join a call.';
    _showDeviceError(msg);
  }
}

function _showDeviceError(msg) {
  const grid = document.querySelector('.device-grid');
  if (grid) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:var(--space-6);text-align:center;color:var(--text-muted);background:var(--bg-surface-2);border-radius:var(--border-radius-lg);border:1px dashed var(--border-color)">
      <i class="fas fa-video-slash" style="font-size:2rem;margin-bottom:var(--space-3);display:block;color:var(--color-warning)"></i>
      <p style="margin:0">${msg}</p>
      <p style="margin:var(--space-2) 0 0;font-size:var(--text-sm)">Serve the project via <code>npx serve .</code> or VS Code Live Server to enable camera access.</p>
    </div>`;
  }
}

function _populateSelect(id, devices, label) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = `<option value="">Select ${label}</option>` +
    devices.map((d, i) => `<option value="${d.deviceId}">${d.label || `${label} ${i + 1}`}</option>`).join('');
}

function _animateAudioBars() {
  document.querySelectorAll('.audio-bar').forEach((bar, i) => {
    setInterval(() => {
      bar.style.height = `${20 + Math.random() * 80}%`;
    }, 120 + i * 80);
  });
}

// ── Pre-Call Controls ────────────────────────────
function _bindPreCallControls() {
  document.getElementById('startConsultBtn')?.addEventListener('click', _startCall);
  document.getElementById('joinConsultBtn')?.addEventListener('click', () => {
    const code = document.getElementById('meetingCodeInput')?.value.trim();
    if (!code) { Toast.warning('Please enter a Meeting ID.'); return; }
    _startCall(code);
  });
  document.getElementById('testSpeakerBtn')?.addEventListener('click', () => {
    Toast.info('Playing test sound through selected speaker.');
  });
}

// ── Start Call ───────────────────────────────────
async function _startCall(meetingCode = null) {
  try {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream = stream;
      document.getElementById('localVideo').srcObject = stream;
    }
  } catch (err) {
    Toast.warning('No camera/microphone access. Joining in audio-only mode.');
  }

  // Show call UI regardless of camera access
  document.getElementById('preCallSection').style.display = 'none';
  document.getElementById('callSection').classList.add('active');
  document.getElementById('pageFooter').style.display = 'none';

  if (meetingCode && typeof meetingCode === 'string') {
    document.getElementById('meetingIdDisplay').textContent = meetingCode;
  }

  _startTimer();

  setTimeout(() => {
    document.getElementById('connectionDot').classList.remove('connecting');
    document.getElementById('connectionText').textContent = 'Connected';
    _addSystemMsg('Dr. Ravi has joined the consultation');
    _addMsg('Dr. Ravi', 'Hi! I am Dr. Ravi. How can I help you today?', 'received');
    Toast.success('Connected to Dr. Ravi');
  }, 1500);
}

// ── Call Controls ────────────────────────────────
function _bindCallControls() {
  document.getElementById('toggleVideoBtn')?.addEventListener('click', () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    isVideoOn = !track.enabled;
    track.enabled = isVideoOn;
    const btn = document.getElementById('toggleVideoBtn');
    btn.innerHTML = `<i class="fas fa-video${isVideoOn ? '' : '-slash'}"></i>`;
    btn.classList.toggle('muted', !isVideoOn);
    _addSystemMsg(`Video turned ${isVideoOn ? 'on' : 'off'}`);
  });

  document.getElementById('toggleMicBtn')?.addEventListener('click', () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    isMicOn = !track.enabled;
    track.enabled = isMicOn;
    const btn = document.getElementById('toggleMicBtn');
    btn.innerHTML = `<i class="fas fa-microphone${isMicOn ? '' : '-slash'}"></i>`;
    btn.classList.toggle('muted', !isMicOn);
    _addSystemMsg(`Microphone turned ${isMicOn ? 'on' : 'off'}`);
  });

  document.getElementById('toggleScreenBtn')?.addEventListener('click', async () => {
    if (!isScreenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        document.getElementById('localVideo').srcObject = screen;
        isScreenSharing = true;
        document.getElementById('toggleScreenBtn').classList.add('active');
        _addSystemMsg('Screen sharing started');
        screen.getVideoTracks()[0].onended = () => {
          document.getElementById('localVideo').srcObject = localStream;
          isScreenSharing = false;
          document.getElementById('toggleScreenBtn').classList.remove('active');
          _addSystemMsg('Screen sharing stopped');
        };
      } catch { /* user cancelled */ }
    } else {
      document.getElementById('localVideo').srcObject = localStream;
      isScreenSharing = false;
      document.getElementById('toggleScreenBtn').classList.remove('active');
      _addSystemMsg('Screen sharing stopped');
    }
  });

  document.getElementById('endCallBtn')?.addEventListener('click', _endCall);

  document.getElementById('toggleChatBtn')?.addEventListener('click', () => {
    isChatOpen = !isChatOpen;
    document.getElementById('chatSidebar').classList.toggle('hidden', !isChatOpen);
    const btn = document.getElementById('toggleChatBtn');
    btn.innerHTML = `<i class="fas fa-comment${isChatOpen ? '-dots' : ''}"></i>`;
    btn.classList.toggle('active', isChatOpen);
  });

  document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
    isChatOpen = false;
    document.getElementById('chatSidebar').classList.add('hidden');
    document.getElementById('toggleChatBtn').innerHTML = '<i class="fas fa-comment"></i>';
  });

  document.getElementById('copyMeetingIdBtn')?.addEventListener('click', async () => {
    const id = document.getElementById('meetingIdDisplay').textContent;
    const ok = await copyToClipboard(id);
    if (ok) Toast.success('Meeting ID copied!');
  });
}

// ── Chat ─────────────────────────────────────────
function _bindChat() {
  const input   = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendMsgBtn');

  const send = () => {
    const msg = input?.value.trim();
    if (!msg) return;
    _addMsg('You', msg, 'sent');
    input.value = '';
    setTimeout(() => {
      _addMsg('Dr. Ravi', DR_RESPONSES[Math.floor(Math.random() * DR_RESPONSES.length)], 'received');
    }, 1000 + Math.random() * 1500);
  };

  sendBtn?.addEventListener('click', send);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}

function _addMsg(sender, text, type) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = `chat-msg ${type}`;
  el.innerHTML = `
    <div class="msg-sender">${sanitize(sender)}</div>
    <div class="msg-bubble">${sanitize(text)}</div>
    <div class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function _addSystemMsg(text) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = 'chat-msg system';
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

// ── Timer ────────────────────────────────────────
function _startTimer() {
  elapsed = 0;
  timerInterval = setInterval(() => {
    elapsed++;
    const el = document.getElementById('meetingTimer');
    if (el) el.textContent = formatDuration(elapsed);
  }, 1000);
}

// ── End Call ─────────────────────────────────────
function _endCall() {
  localStream?.getTracks().forEach(t => t.stop());
  peer?.destroy();
  clearInterval(timerInterval);

  document.getElementById('callSection').classList.remove('active');
  document.getElementById('preCallSection').style.display = '';
  document.getElementById('pageFooter').style.display = '';
  document.getElementById('localVideo').srcObject = null;
  document.getElementById('chatMessages').innerHTML = '';

  isVideoOn = true; isMicOn = true; isScreenSharing = false; isChatOpen = true;
  document.getElementById('meetingIdDisplay').textContent = generateMeetingId();

  Toast.info('Consultation ended.');
  _setupDevices();
}
