# 🚨 HealthGuardian — Emergency Healthcare AI Platform

> AI-powered emergency healthcare when seconds matter.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)

---

## 📌 Overview

**HealthGuardian** is a fully frontend, AI-powered emergency healthcare platform built to assist users during critical medical situations. From one-tap SOS alerts to AI symptom analysis, hospital finding, blood bank locating, and live video consultations — everything is available in one place, with no build step required.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🚨 Emergency SOS | One-tap alert with automatic GPS location sharing |
| 🏥 Smart Hospital Finder | Real-time hospital availability, wait times & directions via Leaflet maps |
| 🩸 Blood Bank Locator | Find nearby blood banks with live blood type availability |
| 🤖 AI Health Assistant | Symptom checker via text, voice & image input |
| 📹 Video Consultation | Encrypted peer-to-peer video calls with doctors via PeerJS |
| 🩹 First Aid Guides | Step-by-step offline-ready guides (CPR, choking, burns & more) |
| 🌙 Dark Mode | Full dark/light theme toggle |
| ♿ Accessibility | WCAG 2.1 AA compliant — ARIA labels, focus-visible, reduced-motion |

---

## 🖥️ Screenshots

> Screenshots available in the `/screenshots` folder.

---

## 🗂️ Project Structure

```
HealthGuardianAI/
├── assets/
│   ├── icons/
│   ├── illustrations/
│   ├── images/
│   └── logos/
├── css/
│   ├── base/           # reset.css, variables.css
│   ├── components/     # buttons, cards, forms, navbar
│   ├── layouts/        # footer
│   ├── pages/          # assistant, emergency, finder, home, video
│   ├── utilities/      # helpers
│   └── main.css
├── data/
│   ├── hospitals.json
│   └── bloodbanks.json
├── docs/
│   └── README.md
├── js/
│   ├── api/
│   ├── assistant/      # AI assistant logic
│   ├── auth/           # Login, register, validation
│   ├── bloodbank/      # Blood bank finder
│   ├── components/     # Navbar, toast notifications
│   ├── config/         # app.config.js (central config)
│   ├── emergency/      # SOS & emergency guides
│   ├── hospitals/      # Hospital finder & map
│   ├── storage/        # localStorage service
│   ├── utils/          # Helper functions
│   ├── video/          # PeerJS video consultation
│   └── main.js
├── pages/
│   ├── assistant.html
│   ├── bloodbank.html
│   ├── emergency.html
│   ├── hospitals.html
│   ├── login.html
│   ├── register.html
│   └── video.html
├── index.html
├── vercel.json
├── netlify.toml
└── README.md
```

---

## 🚀 Quick Start

No build step required. Just open `index.html` in your browser.

For full ES module support, serve via a local server:

```bash
# Option 1 — Node.js
npx serve .

# Option 2 — Python
python3 -m http.server 8080

# Option 3 — VS Code
# Use the Live Server extension and click "Go Live"
```

Then open: [http://localhost:8080](http://localhost:8080)

---

## 🛠️ Tech Stack

- **HTML5** — Semantic, accessible markup
- **CSS3** — Custom design system (no framework), CSS variables, dark mode
- **Vanilla JavaScript** — ES6 modules, no dependencies
- **Leaflet.js** — Interactive maps for hospital & blood bank finder
- **PeerJS** — WebRTC-based peer-to-peer video consultation
- **Font Awesome 6** — Icons
- **Google Fonts** — Inter + Montserrat typography
- **OpenStreetMap** — Map tile provider

---

## ⚙️ Configuration

All app-level settings are in [`js/config/app.config.js`](js/config/app.config.js):

```js
app.name         → 'HealthGuardian'
app.version      → '2.0.0'
app.emergencyPhone → '108'
map.defaultCenter  → Coimbatore, India (lat: 11.0168, lng: 76.9558)
```

---

## 📦 Deployment

### Vercel
```bash
vercel deploy
```
Config already included in `vercel.json` with security headers.

### Netlify
```bash
netlify deploy
```
Config already included in `netlify.toml`.

---

## 📋 Pages

| Page | Path |
|---|---|
| Home | `index.html` |
| Emergency SOS | `pages/emergency.html` |
| Hospital Finder | `pages/hospitals.html` |
| AI Assistant | `pages/assistant.html` |
| Video Consult | `pages/video.html` |
| Blood Bank | `pages/bloodbank.html` |
| Login | `pages/login.html` |
| Register | `pages/register.html` |

---

## 🔒 Security

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Passwords are never stored in session objects
- All localStorage access wrapped in a safe StorageService

---

## 📞 Contact

- 📧 Email: [help@healthguardian.com](mailto:help@healthguardian.com)
- 📱 Phone: +977-9829275143
- 🆘 Emergency Hotline: 1-800-HELP

---

## 📄 License

MIT © 2025 HealthGuardian Team

---

> Built with ❤️ to save lives — because every second counts.
