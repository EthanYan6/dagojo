const App = (() => {
  let wakeLock = null;
  const DRIVE_TIME_KEY = 'hud_drive_start';

  function calcO2(altitude) {
    // Relative to sea level: 100% at 0m, decreases with altitude
    var relative = Math.exp(-altitude / 7990) * 100;
    return relative.toFixed(0);
  }

  function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function init() {
    try {
      var overlay = document.getElementById('permission-overlay');
      var permBtn = document.getElementById('permission-btn');
      var permText = document.getElementById('permission-text');

      var altitudeEl = document.getElementById('altitude');
      var o2IconEl = document.getElementById('o2-icon');
      var locationEl = document.getElementById('location-text');
      var sunLineEl = document.getElementById('sun-line');
      var distanceEl = document.getElementById('distance');
      var datetimeEl = document.getElementById('datetime');
      var driveTimeEl = document.getElementById('drive-time');
      var compassBar = document.getElementById('compass-bar');

      // Initialize drive start time
      if (!localStorage.getItem(DRIVE_TIME_KEY)) {
        localStorage.setItem(DRIVE_TIME_KEY, Date.now().toString());
      }

      // Date, time, and drive duration
      function updateDateTime() {
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, '0');
        var d = String(now.getDate()).padStart(2, '0');
        var time = now.toTimeString().slice(0, 8);
        datetimeEl.textContent = y + '/' + m + '/' + d + ' ' + time;

        // Read drive start from localStorage each time (so reset works)
        var driveStart = parseInt(localStorage.getItem(DRIVE_TIME_KEY)) || Date.now();
        var elapsed = now.getTime() - driveStart;
        driveTimeEl.textContent = formatDuration(elapsed);
      }
      setInterval(updateDateTime, 1000);
      updateDateTime();

      // Permission button handler
      permBtn.addEventListener('click', function() {
        try {
          permText.textContent = '正在请求权限...';

          // Request compass first (synchronous on iOS)
          Compass.init(compassBar).then(function(compassState) {
            return Location.init({
              onAltitude: function(alt) {
                altitudeEl.innerHTML = alt + '<span class="unit">m</span>';
                o2IconEl.textContent = 'O₂ ' + calcO2(alt) + '%';
              },
              onDistance: function(km) {
                distanceEl.innerHTML = km.toFixed(1) + '<span class="unit">km</span>';
              }
            }).then(function(locState) {
              return { compassState: compassState, locState: locState };
            });
          }).then(function(result) {
            if (result.locState === 'denied' && result.compassState === 'denied') {
              permText.textContent = '权限被拒绝，请在浏览器设置中开启';
              return;
            }

            overlay.classList.add('hidden');
            startLocationUpdates(locationEl, sunLineEl);
            requestWakeLock();

            var lastClick = 0;
            distanceEl.addEventListener('click', function() {
              var now = Date.now();
              if (now - lastClick < 400) {
                if (confirm('重置行驶距离和时间？')) {
                  Location.resetDistance();
                  localStorage.setItem(DRIVE_TIME_KEY, Date.now().toString());
                }
              }
              lastClick = now;
            });
          }).catch(function(err) {
            console.error('Permission error:', err);
            permText.textContent = '权限请求出错: ' + err.message;
          });
        } catch (err) {
          console.error('Click handler error:', err);
          permText.textContent = '点击出错: ' + err.message;
        }
      });
    } catch (err) {
      console.error('Init error:', err);
      document.getElementById('permission-text').textContent = '初始化出错: ' + err.message;
    }
  }

  function startLocationUpdates(locationEl, sunLineEl) {
    var lastCoords = null;

    function update() {
      var coords = Location.getCoords();
      if (!coords) return;

      if (!lastCoords ||
          Math.abs(coords.lat - lastCoords.lat) > 0.001 ||
          Math.abs(coords.lon - lastCoords.lon) > 0.001) {
        Geocoding.reverseGeocode(coords.lat, coords.lon).then(function(addr) {
          locationEl.innerHTML = Icons.location() + ' ' + addr;
        });
        lastCoords = coords;
      }

      if (typeof SunCalc !== 'undefined') {
        try {
          var times = SunCalc.getTimes(new Date(), coords.lat, coords.lon);
          var fmt = function(d) {
            var h = String(d.getHours()).padStart(2, '0');
            var m = String(d.getMinutes()).padStart(2, '0');
            return h + ':' + m;
          };
          sunLineEl.innerHTML = Icons.sunrise() + ' ' + fmt(times.sunrise) + '  ' + Icons.sunset() + ' ' + fmt(times.sunset);
        } catch (e) {
          sunLineEl.textContent = '日出日落计算失败';
        }
      } else {
        sunLineEl.textContent = 'SunCalc未加载';
      }
    }

    update();
    setInterval(update, 5000);
  }

  function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(function(lock) {
          wakeLock = lock;
          document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
              navigator.wakeLock.request('screen').then(function(lock2) {
                wakeLock = lock2;
              }).catch(function() {});
            }
          });
        }).catch(function() {});
      }
    } catch (e) {}
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function() {
  try {
    App.init();
  } catch (err) {
    console.error('App init error:', err);
    document.getElementById('permission-text').textContent = '初始化出错: ' + err.message;
  }
});
