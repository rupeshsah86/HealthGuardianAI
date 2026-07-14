# Changelog

All notable changes to HealthGuardian are documented here.

## [2.0.0] — 2025 (Professional Rebuild)

### Added
- Complete design system with CSS custom properties (variables.css)
- Dark mode support via `data-theme` attribute
- ES6 module architecture (no globals)
- Centralized StorageService (safe localStorage wrapper)
- Toast notification system
- Proper auth module with input validation and password strength check
- Navbar component with scroll effect, mobile menu, profile dropdown
- Reusable button, card, form, and utility CSS components
- Accessibility: ARIA labels, focus-visible, sr-only, reduced-motion
- Scroll reveal animations via IntersectionObserver
- Professional landing page with hero mockup, stats, testimonials
- JSON data files for hospitals and blood banks
- .gitignore, README, CHANGELOG

### Fixed
- Duplicate `checkAuthState` and `logout` functions in auth.js
- Duplicate `DOMContentLoaded` listeners
- Broken footer links (`video conference` → `video.html`)
- Windows backslash paths in CSS/JS `<link>` and `<script>` tags
- Missing `login.js` file reference
- Passwords no longer stored in session object
- Inconsistent hospital data (Raxaul entry removed)

### Changed
- Folder structure reorganized to enterprise standard
- All CSS split into base / components / layouts / pages / utilities
- All JS split into auth / components / config / storage / utils modules
- Typography upgraded to Inter + Montserrat
- Color palette refined with full alpha variants
- Shadows, spacing, and border-radius unified via design tokens

## [1.0.0] — 2025 (Hackathon Prototype)
- Initial frontend-only prototype
