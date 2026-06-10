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
