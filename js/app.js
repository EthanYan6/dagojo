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

    function update() {
      const coords = Location.getCoords();
      if (!coords) return;

      // Geocoding
      if (!lastCoords ||
          Math.abs(coords.lat - lastCoords.lat) > 0.001 ||
          Math.abs(coords.lon - lastCoords.lon) > 0.001) {
        Geocoding.reverseGeocode(coords.lat, coords.lon).then(addr => {
          locationEl.innerHTML = `${Icons.location()} ${addr}`;
        });
        lastCoords = coords;
      }

      // Sunrise/sunset
      if (typeof SunCalc !== 'undefined') {
        try {
          const times = SunCalc.getTimes(new Date(), coords.lat, coords.lon);
          const fmt = d => {
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
          };
          sunriseEl.innerHTML = `${Icons.sunrise()} ${fmt(times.sunrise)}`;
          sunsetEl.innerHTML = `${Icons.sunset()} ${fmt(times.sunset)}`;
        } catch (e) {
          sunriseEl.textContent = '计算失败';
          sunsetEl.textContent = '计算失败';
        }
      } else {
        sunriseEl.textContent = 'SunCalc未加载';
        sunsetEl.textContent = 'SunCalc未加载';
      }
    }

    // Update immediately and then every 5 seconds
    update();
    setInterval(update, 5000);
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
