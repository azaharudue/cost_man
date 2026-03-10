# PWA Costs — Cross-Platform Expense Tracker

A Progressive Web App for tracking daily and monthly expenses with budgets, analytics, and calendar views. Built for **web (desktop/mobile), iOS, and Android** with code splitting and offline support.

**Features:**
- **Dashboard**: Budget vs spending, monthly trends, search & filters, alerts
- **Calendar**: Day-by-day expense entry with multiple expenses per day
- **Analytics**: Monthly trends, spending by category with visual charts  
- **Cross-Platform**: Web PWA, native iOS app, native Android app
- **Offline First**: Works offline; syncs to optional backend
- **Code Splitting**: Dynamic module loading (~8KB initial, 35KB total)
- **Mobile-Optimized**: Safe area support, touch-friendly (48px+ tap targets)

## Quick Start

### Web (Browser, Windows/Mac/Linux, Android)

```bash
npm ci
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
```

Deploy to GitHub Pages or any static host. Add to home screen on mobile for full PWA experience.

### iOS (iPhone/iPad)

1. Install native dependencies:
   ```bash
   npm install -D @capacitor/core @capacitor/cli @capacitor/ios
   ```

2. Build and add iOS platform:
   ```bash
   npm run cap:build
   npm run cap:add:ios
   npm run cap:open:ios
   ```

3. In Xcode: Configure signing & deploy to device or App Store

### Android (Phone/Tablet)

1. Install native dependencies:
   ```bash
   npm install -D @capacitor/core @capacitor/cli @capacitor/android
   ```

2. Build and add Android platform:
   ```bash
   npm run cap:build
   npm run cap:add:android
   npm run cap:open:android
   ```

3. In Android Studio: Build APK or deploy to App Store

### Backend (Optional)

```bash
cd server
npm ci
node index.js        # :3000
```

Docker:
```bash
docker build -t pwa-costs-server ./server
docker run -p 3000:3000 pwa-costs-server
```

## Architecture

```
src/
  main.js            # Router, PWA install prompt, safe areas
  utils.js           # Storage, API, export/import
  styles.css         # Responsive, touch-friendly, notch-aware
  views/
    dashboard.js     # Budget tracking, filters, alerts
    calendar.js      # Calendar with daily expenses
    details.js       # Analytics & charts
```

**Key Optimizations:**
- Safe area insets for notched/punch-hole devices
- 48px+ minimum tap targets for mobile
- `-webkit-` prefixes for iOS support
- Viewport-fit: cover for full-screen web apps
- Native feel with custom tap feedback

## Platform-Specific Notes

| Platform | Install | Offline | Sync | Notes |
|----------|---------|---------|------|-------|
| **Web** | "Add to Home Screen" | ✅ | Optional | All browsers, PWA-capable |
| **iOS** | Xcode/App Store | ✅ | Optional | Full-screen, safe areas respected |
| **Android** | Android Studio/Play Store | ✅ | Optional | Material design, hardware back button |

## Development Tips

- **Test PWA**: DevTools → Application → Manifest & Service Workers
- **Test Mobile**: DevTools Device Mode, or `npm run dev` + phone on same network
- **Notch Testing**: iOS: Safari Developer → Develop → View → Simulate notch
- **Build Check**: `npm run build` and serve `dist/` locally to test production

Code splitting + tree-shaking keeps app <35KB gzipped across all platforms.
# PWA Costs

This repository contains a small Progressive Web App (PWA) to track daily and monthly costs. The frontend is a Vite app (installable on desktop and Android). A simple Express + SQLite backend is included in `/server` if you want a centralized store.

Quick start (frontend only):

```bash
# from project root
npm install
npm run dev
```

Open http://localhost:5173 and use the app. The frontend works offline and stores data in `localStorage` by default.

Deploy frontend to GitHub Pages (free):

1. Push the repository to GitHub and ensure your default branch is `main`.
2. The included GitHub Action will build and deploy `dist` to the `gh-pages` branch on push to `main`.

Backend (optional):

```bash
cd server
npm install
node index.js
```

This starts the API on port 3000. Configure the frontend to call your hosted API (not implemented by default — the frontend uses localStorage unless you wire the API endpoints).

Docker (server):

```bash
docker build -t pwa-costs-server ./server
docker run -p 3000:3000 pwa-costs-server
```

Install the PWA:

- On Android Chrome: open the site, tap the menu -> "Add to Home screen".
- On Desktop Chrome/Edge: open the site, look for the install icon in the address bar or use the triple-dot menu -> "Install app". On macOS, Safari supports adding to the Home Screen when available.

Notes on hosting full stack for free:
- GitHub Pages can host the frontend for free with HTTPS (PWA install and service worker work).
- The server cannot run on GitHub Pages — you'll need a free-tier host for the backend (Render, Railway, Fly, Fly.io, or similar). The `server` folder and Dockerfile make that straightforward.
