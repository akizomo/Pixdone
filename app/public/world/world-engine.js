/**
 * World Engine — theme-agnostic canvas setup utilities.
 * Each theme provides its own draw module (e.g. arcade/arcade-world.js).
 */

// eslint-disable-next-line no-unused-vars
const WorldEngine = (() => {
  function getWorldColors(prefix) {
    const style = getComputedStyle(document.documentElement);
    const get = (name) => style.getPropertyValue(`--pd-${prefix}-world-${name}`).trim() || '#000';
    return {
      wall: get('wall'),
      floor: get('floor'),
      trim: get('trim'),
      bitBody: get('bit-body'),
      bitEye: get('bit-eye'),
    };
  }

  /**
   * Configure a canvas for pixel-art rendering.
   * Only updates internal resolution when the CSS size actually changes.
   */
  function setupCanvas(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  return { getWorldColors, setupCanvas };
})();
