const Compass = (() => {
  const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const TICKS = 24; // number of items visible in the bar

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

    // Adjust for screen orientation (landscape mode)
    // webkitCompassHeading is relative to device top, we need to adjust for screen rotation
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    currentHeading = ((currentHeading - angle) % 360 + 360) % 360;

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
