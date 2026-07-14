# HealthGuardian — Emergency Healthcare AI Platform

> AI-powered emergency healthcare when seconds matter.

## Features
- 🚨 Emergency SOS with geolocation
- 🏥 Smart Hospital Finder (Leaflet maps)
- 🩸 Blood Bank Locator with live availability
- 🤖 AI Symptom Checker (text / voice / image)
- 📹 Video Consultation (PeerJS)
- 🩹 First Aid Guides (offline-ready)
- 🌙 Dark Mode
- ♿ Accessible (WCAG 2.1 AA)

## Project Structure
```
EmergencyHealthcareAI/
├── assets/          # Icons, images, illustrations
├── css/             # Design system (variables → components → pages)
├── js/              # Modular ES6 JavaScript
├── pages/           # Inner HTML pages
├── data/            # JSON data files
├── docs/            # Architecture & documentation
└── index.html       # Landing page
```

## Quick Start
Open `index.html` in a browser. No build step required.

For ES module support, serve via a local server:
```bash
npx serve .
# or
python3 -m http.server 8080
```

## Tech Stack
- HTML5 / CSS3 (custom design system, no framework)
- Vanilla ES6 Modules
- Leaflet.js (maps)
- PeerJS (WebRTC video)
- Font Awesome 6
- Google Fonts (Inter + Montserrat)

## License
MIT © 2025 HealthGuardian Team
