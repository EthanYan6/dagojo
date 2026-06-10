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
