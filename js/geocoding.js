const Geocoding = (() => {
  // Using Nominatim (OpenStreetMap) - free, no API key needed
  const API_URL = 'https://nominatim.openstreetmap.org/reverse';

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

      const url = `${API_URL}?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&format=json&accept-language=zh-CN`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'DrivingHUD/1.0'
        }
      });
      const data = await resp.json();

      if (data && data.display_name) {
        // Nominatim returns full address, shorten it
        currentAddress = shortenAddress(data.display_name);
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

  function shortenAddress(full) {
    // Nominatim returns: "具体地址, 区, 市, 省, 国家"
    // We want: "省市区" or shorter
    const parts = full.split(',').map(s => s.trim());
    if (parts.length >= 3) {
      // Take last 3-4 parts (excluding country)
      const relevant = parts.filter(p => !p.match(/中国|China|中华人民共和国/));
      if (relevant.length >= 3) {
        return relevant.slice(-3).join('');
      }
      return relevant.join('');
    }
    return full;
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
