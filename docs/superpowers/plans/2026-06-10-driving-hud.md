# Driving HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a sci-fi driving HUD page for mobile landscape use, deployed to Gitee Pages.

**Architecture:** Single-page static app with modular JS (compass, location, geocoding). No framework, no build step. SunCalc bundled locally for offline use. Amap REST API for reverse geocoding when online.

**Tech Stack:** HTML5, CSS3, vanilla JS, SunCalc library, Amap Web Services API

**Deployment:** GitHub Pages (https://github.com/EthanYan6/dagojo.git)

---

## File Structure

```
index.html              # Main page, layout structure
css/style.css           # All styles (terminal green theme)
js/icons.js             # SVG icon generator functions
js/compass.js           # Compass bar rendering + DeviceOrientationEvent
js/location.js          # Geolocation, altitude, distance tracking
js/geocoding.js         # Amap reverse geocoding
js/app.js               # Main init, wakeLock, error handling
lib/suncalc.js          # SunCalc library (bundled for offline)
```

## Prerequisites

- Amap API key: Register at https://lbs.amap.com/ to get a Web Services API key
- Replace `YOUR_AMAP_KEY` in `js/geocoding.js` with your actual key

---

### Task 1: HTML Structure and CSS Styles

**Files:**
- Create: `index.html`
- Create: `css/style.css`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <title>Driving HUD</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Permission overlay -->
  <div id="permission-overlay">
    <div id="permission-text">请允许定位和陀螺仪权限</div>
    <button id="permission-btn">授权</button>
  </div>

  <!-- Main HUD -->
  <div id="hud">
    <!-- Compass bar -->
    <div id="compass-bar"></div>

    <!-- Content area -->
    <div id="content">
      <!-- Left column -->
      <div id="left-col">
        <div class="info-block">
          <span class="label">海拔</span>
          <div id="altitude" class="big-number">--<span class="unit">m</span></div>
        </div>
        <div class="info-block">
          <span id="location-text" class="secondary">正在获取位置...</span>
        </div>
        <div class="info-block">
          <span id="sunrise-text" class="tertiary">--:--</span>
          <span id="sunset-text" class="tertiary">--:--</span>
        </div>
      </div>

      <!-- Right column -->
      <div id="right-col">
        <div class="info-block">
          <span class="label">已行驶</span>
          <div id="distance" class="big-number">0<span class="unit">km</span></div>
        </div>
        <div class="info-block">
          <div id="clock" class="clock">--:--:--</div>
        </div>
      </div>
    </div>
  </div>

  <script src="lib/suncalc.js"></script>
  <script src="js/icons.js"></script>
  <script src="js/compass.js"></script>
  <script src="js/location.js"></script>
  <script src="js/geocoding.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `css/style.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background: #050510;
  color: #00ff88;
  font-family: 'Courier New', Courier, monospace;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* Permission overlay */
#permission-overlay {
  position: fixed;
  inset: 0;
  background: #050510;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  gap: 20px;
}

#permission-overlay.hidden {
  display: none;
}

#permission-text {
  font-size: 16px;
  opacity: 0.8;
}

#permission-btn {
  background: transparent;
  border: 1px solid #00ff88;
  color: #00ff88;
  padding: 10px 30px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}

/* HUD layout */
#hud {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Compass bar */
#compass-bar {
  width: 100%;
  height: 36px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.3);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 11px;
  letter-spacing: 4px;
  flex-shrink: 0;
}

#compass-bar .compass-item {
  white-space: nowrap;
  transition: opacity 0.1s;
}

#compass-bar .compass-center {
  color: #00ff88;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 2px solid #ff3333;
  padding: 0 4px;
}

/* Content area */
#content {
  flex: 1;
  display: flex;
  padding: 16px 20px;
  gap: 20px;
}

#left-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
}

#right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 8px;
}

/* Info blocks */
.info-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

#right-col .info-block {
  align-items: flex-end;
}

.label {
  font-size: 12px;
  opacity: 0.6;
  letter-spacing: 2px;
}

.big-number {
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 900;
  font-size: 72px;
  line-height: 1;
}

.big-number .unit {
  font-family: 'Courier New', Courier, monospace;
  font-weight: normal;
  font-size: 20px;
  opacity: 0.7;
}

.secondary {
  font-size: 13px;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tertiary {
  font-size: 12px;
  opacity: 0.5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tertiary + .tertiary {
  margin-top: 2px;
}

.clock {
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  opacity: 0.8;
}

/* SVG icon sizing */
.icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: #00ff88;
  stroke-width: 1.5;
  flex-shrink: 0;
}

.icon-sm {
  width: 12px;
  height: 12px;
}

/* Reset hint */
#distance {
  cursor: pointer;
}
```

- [ ] **Step 3: Verify files exist**

Run: `ls -la index.html css/style.css`
Expected: Both files exist.

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "feat: add HTML structure and base styles"
```

---

### Task 2: SVG Icons

**Files:**
- Create: `js/icons.js`

- [ ] **Step 1: Create `js/icons.js`**

```javascript
const Icons = {
  location() {
    return `<svg class="icon icon-sm" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="3"/>
      <line x1="8" y1="1" x2="8" y2="4"/>
      <line x1="8" y1="12" x2="8" y2="15"/>
      <line x1="1" y1="8" x2="4" y2="8"/>
      <line x1="12" y1="8" x2="15" y2="8"/>
    </svg>`;
  },

  sunrise() {
    return `<svg class="icon icon-sm" viewBox="0 0 16 16">
      <path d="M2 12 A6 6 0 0 1 14 12" stroke-linecap="round"/>
      <line x1="8" y1="2" x2="8" y2="5"/>
      <line x1="3" y1="5" x2="5" y2="7"/>
      <line x1="13" y1="5" x2="11" y2="7"/>
      <line x1="1" y1="12" x2="15" y2="12"/>
    </svg>`;
  },

  sunset() {
    return `<svg class="icon icon-sm" viewBox="0 0 16 16">
      <path d="M2 10 A6 6 0 0 1 14 10" stroke-linecap="round"/>
      <line x1="8" y1="14" x2="8" y2="11"/>
      <line x1="3" y1="11" x2="5" y2="9"/>
      <line x1="13" y1="11" x2="11" y2="9"/>
      <line x1="1" y1="10" x2="15" y2="10"/>
    </svg>`;
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add js/icons.js
git commit -m "feat: add SVG icon generators"
```

---

### Task 3: Compass Module

**Files:**
- Create: `js/compass.js`

- [ ] **Step 1: Create `js/compass.js`**

```javascript
const Compass = (() => {
  const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const TICKS = 36; // number of items visible in the bar

  let currentHeading = 0;
  let barEl = null;

  function init(element) {
    barEl = element;
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ requires permission
      return DeviceOrientationEvent.requestPermission().then(state => {
        if (state === 'granted') {
          window.addEventListener('deviceorientation', onOrientation);
        }
        return state;
      });
    } else if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', onOrientation);
      return Promise.resolve('granted');
    }
    return Promise.resolve('denied');
  }

  function onOrientation(event) {
    // alpha: 0-360, compass heading on most devices
    if (event.webkitCompassHeading !== undefined) {
      currentHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      currentHeading = (360 - event.alpha) % 360;
    }
    render();
  }

  function render() {
    if (!barEl) return;

    const items = [];
    const half = Math.floor(TICKS / 2);
    const headingDeg = Math.round(currentHeading);
    const step = 10; // degrees per tick

    for (let i = -half; i <= half; i++) {
      const deg = ((headingDeg + i * step) % 360 + 360) % 360;
      const isCenter = i === 0;
      const dist = Math.abs(i);
      const opacity = Math.max(0.15, 1 - dist / (half + 1));

      // Determine label
      let label;
      const dirIndex = Math.round(deg / 45) % 8;
      if (deg % 45 < 5 || deg % 45 > 40) {
        label = DIRECTIONS[dirIndex];
      } else {
        label = deg + '°';
      }

      if (isCenter) {
        items.push(`<span class="compass-item compass-center">${label}</span>`);
      } else {
        items.push(`<span class="compass-item" style="opacity:${opacity}">${label}</span>`);
      }
    }

    barEl.innerHTML = items.join('');
  }

  function getHeading() {
    return currentHeading;
  }

  return { init, getHeading };
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/compass.js
git commit -m "feat: add compass module with DeviceOrientationEvent"
```

---

### Task 4: Location and Distance Module

**Files:**
- Create: `js/location.js`

- [ ] **Step 1: Create `js/location.js`**

```javascript
const Location = (() => {
  const STORAGE_KEY = 'hud_distance';
  const STORAGE_POS_KEY = 'hud_last_pos';

  let totalDistance = 0;
  let lastLat = null;
  let lastLon = null;
  let watchId = null;
  let onAltitude = null;
  let onDistance = null;

  function init(callbacks) {
    onAltitude = callbacks.onAltitude || (() => {});
    onDistance = callbacks.onDistance || (() => {});

    // Restore from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) totalDistance = parseFloat(saved) || 0;

    const savedPos = localStorage.getItem(STORAGE_POS_KEY);
    if (savedPos) {
      try {
        const pos = JSON.parse(savedPos);
        lastLat = pos.lat;
        lastLon = pos.lon;
      } catch (e) {}
    }

    onDistance(totalDistance);

    if (!('geolocation' in navigator)) {
      return Promise.resolve('denied');
    }

    return new Promise(resolve => {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          resolve('granted');
          handlePosition(pos);
        },
        err => {
          resolve('denied');
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    });
  }

  function handlePosition(pos) {
    const { latitude, longitude, altitude } = pos.coords;

    // Altitude
    if (altitude !== null && altitude !== undefined) {
      onAltitude(Math.round(altitude));
    }

    // Distance calculation
    if (lastLat !== null && lastLon !== null) {
      const dist = haversine(lastLat, lastLon, latitude, longitude);
      // Filter out GPS jitter: only add if > 2m/s movement or total is small
      if (dist > 0.002 || totalDistance < 0.01) {
        totalDistance += dist;
        localStorage.setItem(STORAGE_KEY, totalDistance.toFixed(3));
        onDistance(totalDistance);
      }
    }

    lastLat = latitude;
    lastLon = longitude;
    localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ lat: latitude, lon: longitude }));
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function resetDistance() {
    totalDistance = 0;
    localStorage.setItem(STORAGE_KEY, '0');
    onDistance(0);
  }

  function getCoords() {
    if (lastLat !== null && lastLon !== null) {
      return { lat: lastLat, lon: lastLon };
    }
    return null;
  }

  return { init, resetDistance, getCoords };
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/location.js
git commit -m "feat: add location module with distance tracking and localStorage"
```

---

### Task 5: Geocoding Module

**Files:**
- Create: `js/geocoding.js`

- [ ] **Step 1: Create `js/geocoding.js`**

```javascript
const Geocoding = (() => {
  // Replace with your Amap Web Services API key
  const AMAP_KEY = 'YOUR_AMAP_KEY';
  const API_URL = 'https://restapi.amap.com/v3/geocode/regeo';

  let lastQueryLat = null;
  let lastQueryLon = null;
  let currentAddress = '';
  let pending = false;

  async function reverseGeocode(lat, lon) {
    // Check threshold: skip if < 10km from last query
    if (lastQueryLat !== null && lastQueryLon !== null) {
      const dist = haversineKm(lastQueryLat, lastQueryLon, lat, lon);
      if (dist < 10) return currentAddress;
    }

    if (pending) return currentAddress;
    pending = true;

    try {
      if (!navigator.onLine) {
        currentAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        return currentAddress;
      }

      const url = `${API_URL}?key=${AMAP_KEY}&location=${lon.toFixed(6)},${lat.toFixed(6)}&output=json`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (data.status === '1' && data.regeocode) {
        currentAddress = data.regeocode.formatted_address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        lastQueryLat = lat;
        lastQueryLon = lon;
      } else {
        currentAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } catch (e) {
      currentAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    pending = false;
    return currentAddress;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return { reverseGeocode };
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/geocoding.js
git commit -m "feat: add Amap reverse geocoding module"
```

---

### Task 6: SunCalc Library

**Files:**
- Create: `lib/suncalc.js`

- [ ] **Step 1: Download SunCalc**

Download from https://github.com/mourner/suncalc/blob/master/suncalc.js and save to `lib/suncalc.js`. Alternatively, fetch it:

```bash
mkdir -p lib
curl -sL https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js -o lib/suncalc.js
```

- [ ] **Step 2: Verify file exists and has content**

Run: `head -5 lib/suncalc.js`
Expected: Should start with SunCalc source code (not HTML error page).

- [ ] **Step 3: Commit**

```bash
git add lib/suncalc.js
git commit -m "feat: bundle SunCalc library for offline sunrise/sunset"
```

---

### Task 7: Main App Initialization

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Create `js/app.js`**

```javascript
const App = (() => {
  let wakeLock = null;

  async function init() {
    const overlay = document.getElementById('permission-overlay');
    const permBtn = document.getElementById('permission-btn');
    const permText = document.getElementById('permission-text');

    // Elements
    const altitudeEl = document.getElementById('altitude');
    const locationEl = document.getElementById('location-text');
    const sunriseEl = document.getElementById('sunrise-text');
    const sunsetEl = document.getElementById('sunset-text');
    const distanceEl = document.getElementById('distance');
    const clockEl = document.getElementById('clock');
    const compassBar = document.getElementById('compass-bar');

    // Clock
    setInterval(() => {
      const now = new Date();
      clockEl.textContent = now.toTimeString().slice(0, 8);
    }, 1000);

    // Initial clock
    clockEl.textContent = new Date().toTimeString().slice(0, 8);

    // Permission button handler
    permBtn.addEventListener('click', async () => {
      permText.textContent = '正在请求权限...';

      // Request location
      const locState = await Location.init({
        onAltitude: alt => {
          altitudeEl.innerHTML = `${alt}<span class="unit">m</span>`;
        },
        onDistance: km => {
          distanceEl.innerHTML = `${km.toFixed(1)}<span class="unit">km</span>`;
        }
      });

      // Request compass
      const compassState = await Compass.init(compassBar);

      if (locState === 'denied' && compassState === 'denied') {
        permText.textContent = '权限被拒绝，请在浏览器设置中开启';
        return;
      }

      overlay.classList.add('hidden');

      // Location updates: geocoding + sunrise/sunset
      startLocationUpdates(locationEl, sunriseEl, sunsetEl);

      // Wake lock
      requestWakeLock();

      // Distance reset: double click
      let lastClick = 0;
      distanceEl.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastClick < 400) {
          if (confirm('重置行驶距离？')) {
            Location.resetDistance();
          }
        }
        lastClick = now;
      });
    });
  }

  function startLocationUpdates(locationEl, sunriseEl, sunsetEl) {
    let lastCoords = null;

    setInterval(async () => {
      const coords = Location.getCoords();
      if (!coords) return;

      // Geocoding
      if (!lastCoords ||
          Math.abs(coords.lat - lastCoords.lat) > 0.001 ||
          Math.abs(coords.lon - lastCoords.lon) > 0.001) {
        const addr = await Geocoding.reverseGeocode(coords.lat, coords.lon);
        locationEl.innerHTML = `${Icons.location()} ${addr}`;
        lastCoords = coords;
      }

      // Sunrise/sunset
      try {
        const times = SunCalc.getTimes(new Date(), coords.lat, coords.lon);
        const fmt = d => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };
        sunriseEl.innerHTML = `${Icons.sunrise()} ${fmt(times.sunrise)}`;
        sunsetEl.innerHTML = `${Icons.sunset()} ${fmt(times.sunset)}`;
      } catch (e) {}
    }, 5000);
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible') {
            try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
          }
        });
      }
    } catch (e) {}
  }

  return { init };
})();

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: add main app initialization with wakeLock and error handling"
```

---

### Task 8: GitHub Pages Configuration

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Update git remote to GitHub**

```bash
git remote set-url origin https://github.com/EthanYan6/dagojo.git
```

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: configure gitignore for GitHub Pages"
```

---

### Task 9: Integration Test and Polish

**Files:**
- Modify: `js/app.js`
- Modify: `css/style.css`

- [ ] **Step 1: Test in browser**

Open `index.html` in a mobile browser (or Chrome DevTools mobile emulation with geolocation override). Verify:
- Permission overlay appears
- Compass bar renders after granting orientation permission
- Altitude updates
- Location text updates
- Sunrise/sunset times display
- Distance increments while moving
- Clock ticks every second
- Double-click distance resets

- [ ] **Step 2: Fix any issues found during testing**

Adjust CSS sizes, JS timing, or error handling as needed.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final polish and fixes"
```

---

### Task 10: Deploy to GitHub Pages

- [ ] **Step 1: Push to GitHub**

```bash
git push origin master
```

- [ ] **Step 2: Enable GitHub Pages**

Go to GitHub repo > Settings > Pages > Source: Deploy from a branch > `master` / `/ (root)` > Save.

- [ ] **Step 3: Test on mobile**

Open the GitHub Pages URL (https://ethanyan6.github.io/dagojo/) on your phone. Test:
- Landscape orientation
- Real GPS and compass
- Network on/off behavior (address fallback to coordinates)
- WakeLock (screen stays on)

- [ ] **Step 4: Note the Amap API key**

If you haven't yet, register at https://lbs.amap.com/ and replace `YOUR_AMAP_KEY` in `js/geocoding.js` with your actual key, then push again.
