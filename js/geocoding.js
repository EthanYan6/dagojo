const Geocoding = (() => {
  // BigDataCloud - free for client-side, no API key needed, good CORS support
  const API_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

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
        pending = false;
        return currentAddress;
      }

      const url = `${API_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=zh`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (data) {
        // Build address from components
        const parts = [];
        if (data.principalSubdivision) parts.push(data.principalSubdivision);
        if (data.city) parts.push(data.city);
        if (data.locality) parts.push(data.locality);
        if (data.localityInfo && data.localityInfo.administrative) {
          // Try to get more detailed info
          const admin = data.localityInfo.administrative;
          for (let i = admin.length - 1; i >= 0; i--) {
            if (admin[i].name && !parts.includes(admin[i].name)) {
              parts.push(admin[i].name);
            }
          }
        }

        if (parts.length > 0) {
          currentAddress = parts.slice(0, 4).join('');
          lastQueryLat = lat;
          lastQueryLon = lon;
        } else if (data.locality) {
          currentAddress = data.locality;
          lastQueryLat = lat;
          lastQueryLon = lon;
        } else {
          currentAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
      } else {
        currentAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } catch (e) {
      console.error('Geocoding error:', e);
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
