/**
 * empire/fallbacks/HDRIFallback.js
 *
 * Procedural environment map used whenever a floor's real .hdr file fails
 * to load. Builds a vertical-gradient sky (zenith -> floor themeColor ->
 * nadir) baked into a DataTexture with equirectangular mapping, so it can
 * be dropped straight into `scene.environment` / `scene.background` the
 * same way a loaded HDRTexture would be.
 *
 * Requires THREE to be passed in by the caller (AssetLoader).
 */

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#888888');
  if (!m) return [136, 136, 136];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export function generateFallbackHDRI(THREE, floor, width = 256, height = 128) {
  const [r, g, b] = hexToRgb(floor.themeColor);
  const data = new Float32Array(width * height * 4);

  const zenith = [0.02, 0.02, 0.04];
  const nadir = [0.01, 0.01, 0.01];
  const mid = [r / 255, g / 255, b / 255];

  for (let y = 0; y < height; y++) {
    const t = y / (height - 1); // 0 = top (zenith) .. 1 = bottom (nadir)
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let cr, cg, cb;
      if (t < 0.5) {
        const u = t / 0.5;
        cr = zenith[0] + (mid[0] - zenith[0]) * u;
        cg = zenith[1] + (mid[1] - zenith[1]) * u;
        cb = zenith[2] + (mid[2] - zenith[2]) * u;
      } else {
        const u = (t - 0.5) / 0.5;
        cr = mid[0] + (nadir[0] - mid[0]) * u;
        cg = mid[1] + (nadir[1] - mid[1]) * u;
        cb = mid[2] + (nadir[2] - mid[2]) * u;
      }
      data[idx] = cr;
      data[idx + 1] = cg;
      data[idx + 2] = cb;
      data[idx + 3] = 1;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  texture.userData = { procedural: true, floor: floor.floor, slot: 'hdri' };
  return texture;
}
