const App = (() => {
  let wakeLock = null;

  async function init() {
    const overlay = document.getElementById('permission-overlay');
    const permBtn = document.getElementById('permission-btn');
    const permText = document.getElementById('permission-text');

    // Check HTTPS (required for iOS)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      permText.textContent = '⚠ iOS需要HTTPS访问，请使用https://开头的地址';
      permBtn.style.display = 'none';
      return;
    }

    // Elements
    const altitudeEl = document.getElementById('altitude');
    const locationEl = document.getElementById('location-text');
    const sunLineEl = document.getElementById('sun-line');
    const distanceEl = document.getElementById('distance');
    const datetimeEl = document.getElementById('datetime');
    const compassBar = document.getElementById('compass-bar');

    // Date and time
    function updateDateTime() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const time = now.toTimeString().slice(0, 8);
      datetimeEl.textContent = `${y}/${m}/${d} ${time}`;
    }
    setInterval(updateDateTime, 1000);
    updateDateTime();

    // Permission button handler
    // On iOS, DeviceOrientationEvent.requestPermission() MUST be called
    // synchronously from a user gesture, not after an await.
    permBtn.addEventListener('click', function() {
      permText.textContent = '正在请求权限...';

      // Request compass FIRST (must be synchronous from click on iOS)
      Compass.init(compassBar).then(compassState => {
        // Then request location
        return Location.init({
          onAltitude: alt => {
            altitudeEl.innerHTML = `${alt}<span class="unit">m</span>`;
          },
          onDistance: km => {
            distanceEl.innerHTML = `${km.toFixed(1)}<span class="unit">km</span>`;
          }
        }).then(locState => ({ compassState, locState }));
      }).then(({ compassState, locState }) => {
        if (locState === 'denied' && compassState === 'denied') {
          permText.textContent = '权限被拒绝，请在浏览器设置中开启';
          return;
        }

        overlay.classList.add('hidden');

        // Location updates: geocoding + sunrise/sunset
        startLocationUpdates(locationEl, sunLineEl);

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
      }).catch(err => {
        console.error('Permission error:', err);
        permText.textContent = '权限请求出错: ' + err.message;
      });
    });
  }

  function startLocationUpdates(locationEl, sunLineEl) {
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

      // Sunrise/sunset on one line
      if (typeof SunCalc !== 'undefined') {
        try {
          const times = SunCalc.getTimes(new Date(), coords.lat, coords.lon);
          const fmt = d => {
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
          };
          sunLineEl.innerHTML = `${Icons.sunrise()} ${fmt(times.sunrise)}  ${Icons.sunset()} ${fmt(times.sunset)}`;
        } catch (e) {
          sunLineEl.textContent = '日出日落计算失败';
        }
      } else {
        sunLineEl.textContent = 'SunCalc未加载';
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
document.addEventListener('DOMContentLoaded', () => {
  try {
    App.init();
  } catch (err) {
    console.error('App init error:', err);
    document.getElementById('permission-text').textContent = '初始化出错: ' + err.message;
  }
});
