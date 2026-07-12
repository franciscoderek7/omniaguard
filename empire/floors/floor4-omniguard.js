/**
 * empire/floors/floor4-omniguard.js
 *
 * Floor 4 — OmniGuard cybersecurity lobby scene (Three.js module).
 *
 * NOTE ON FLOOR NUMBER: this was handed off labeled "Floor 1," but
 * AssetManifest.js (already shipped on main) places OmniGuard at Floor 4 —
 * Floor 1 is Francisco Holdings Inc., the parent/lobby floor, per EMPIRE.md's
 * Holding Structure table. Filed under Floor 4 to match the shipped manifest;
 * flag to Derek if OmniGuard should actually be Floor 1 (would require
 * renumbering AssetManifest.js).
 *
 * Brand note: "OmniaGuard" was retired 2026-06-19 in favor of "OmniGuard"
 * (see CLAUDE.md brand enforcement table) — renamed accordingly. Neon point
 * light colors corrected to the brand-spec hex from CLAUDE.md
 * (blue #4A90E2 / pink #E91E63) — OmniGuard is the only brand permitted to
 * use blue or pink anywhere in the empire.
 *
 * Self-contained primitive-built scene (does not depend on
 * empire/AssetLoader.js) — returns { scene, camera, update } for a future
 * engine.js to mount and drive.
 *
 * PHASE 2 ADDITIONS (Derek's "BUILD PHASE 2 NOW" order): AI Core sphere now
 * pulses blue<->pink instead of static cyan; a 14-layer particle shield
 * surrounds the core (hover-glow / click-pulse via a raycaster against 14
 * invisible hit-spheres — added with window-level listeners, which is safe
 * because floor-registry.js's loadFloorScene() caches this module's factory
 * result and only ever calls createOmniGuardScene() once per page load, so
 * the listeners are never re-attached/duplicated on repeat floor visits);
 * the flat threat-map placeholder is replaced with a rotating wireframe
 * globe with surface "blips"; three canvas-texture holographic data panels
 * were added (procedural text, no external asset, same CanvasTexture
 * approach scene.js uses for the brushed-steel door normal map).
 */

const BLUE = { r: 0x4a, g: 0x90, b: 0xe2 };
const PINK = { r: 0xe9, g: 0x1e, b: 0x63 };
const SHIELD_LAYERS = 14;

function lerpColorHex(c1, c2, t) {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return (r << 16) | (g << 8) | b;
}

// Fibonacci sphere sampling — even point distribution without trig-heavy jitter.
function fibonacciSpherePoint(i, n, radius) {
  const offset = 2 / n;
  const increment = Math.PI * (3 - Math.sqrt(5));
  const y = i * offset - 1 + offset / 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = i * increment;
  return {
    x: Math.cos(phi) * r * radius,
    y: y * radius,
    z: Math.sin(phi) * r * radius,
  };
}

function createShieldLayer(THREE, layerIndex) {
  const t = layerIndex / (SHIELD_LAYERS - 1);
  const radius = 2.2 + layerIndex * 0.35;
  const particleCount = 36 + layerIndex * 2;
  const color = lerpColorHex(BLUE, PINK, t);

  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const p = fibonacciSpherePoint(i, particleCount, radius);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y + 3; // recenter on the threat core's height
    positions[i * 3 + 2] = p.z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color,
    size: 0.07,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);

  // Invisible hit-sphere: the actual raycast target for hover/click, since
  // raycasting against sparse Points is unreliable at typical camera distances.
  const hitGeo = new THREE.SphereGeometry(radius, 16, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  hitSphere.position.set(0, 3, 0);
  hitSphere.userData.shieldLayerIndex = layerIndex;

  return { points, hitSphere, baseOpacity: 0.35, baseSize: 0.07, radius };
}

function createThreatGlobe(THREE) {
  const group = new THREE.Group();
  group.position.set(0, 2.5, -7);

  const wireGeo = new THREE.IcosahedronGeometry(2, 2);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x4a90e2,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const wireGlobe = new THREE.Mesh(wireGeo, wireMat);
  group.add(wireGlobe);

  const blipGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const blipCount = 30;
  for (let i = 0; i < blipCount; i++) {
    const isPink = i % 3 === 0;
    const blipMat = new THREE.MeshBasicMaterial({ color: isPink ? 0xe91e63 : 0x4a90e2 });
    const blip = new THREE.Mesh(blipGeo, blipMat);
    const p = fibonacciSpherePoint(i, blipCount, 2.02);
    blip.position.set(p.x, p.y, p.z);
    group.add(blip);
  }

  return { group, wireGlobe };
}

// Procedural canvas-texture "holographic" data panel — no external asset,
// same CanvasTexture technique scene.js uses for the brushed-steel normal map.
function createHoloPanel(THREE, title, value) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(5, 10, 20, 0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#4A90E2';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#7db4ed';
  ctx.font = '28px monospace';
  ctx.fillText(title, 28, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px monospace';
  ctx.fillText(value, 28, 150);
  ctx.fillStyle = '#E91E63';
  ctx.font = '20px monospace';
  ctx.fillText('OMNIGUARD AI SECURITY', 28, 210);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
  });
  const geo = new THREE.PlaneGeometry(2.6, 1.3);
  return new THREE.Mesh(geo, mat);
}

export function createOmniGuardScene(THREE) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070d, 10, 60);

  // CAMERA SETUP
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 12);

  // RENDERER LIGHTING BASE
  const ambient = new THREE.AmbientLight(0x1a2a3a, 0.8);
  scene.add(ambient);

  const neonBlue = new THREE.PointLight(0x4A90E2, 2, 50);
  neonBlue.position.set(-5, 4, 5);
  scene.add(neonBlue);

  const neonPink = new THREE.PointLight(0xE91E63, 2, 50);
  neonPink.position.set(5, 4, 5);
  scene.add(neonPink);

  // FLOOR PLANE (cyber grid base)
  const floorGeo = new THREE.PlaneGeometry(50, 50, 50, 50);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f1a,
    metalness: 0.6,
    roughness: 0.2,
    wireframe: false
  });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // CENTRAL AI CORE (pulses blue <-> pink, per Phase 2 spec)
  const coreGeo = new THREE.IcosahedronGeometry(1.5, 2);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x4A90E2,
    emissive: 0x4A90E2,
    emissiveIntensity: 0.6,
    metalness: 1,
    roughness: 0.1
  });

  const threatCore = new THREE.Mesh(coreGeo, coreMat);
  threatCore.position.set(0, 3, 0);
  scene.add(threatCore);

  // SECURITY NODES (floating data points)
  const nodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.2, 16, 16);

  for (let i = 0; i < 20; i++) {
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xff3355,
      emissive: 0x220011
    });

    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 5 + 1,
      (Math.random() - 0.5) * 20
    );

    scene.add(node);
    nodes.push(node);
  }

  // 14-LAYER PARTICLE SHIELD around the AI core, hover/click interactive.
  const shieldLayers = [];
  for (let i = 0; i < SHIELD_LAYERS; i++) {
    const layer = createShieldLayer(THREE, i);
    scene.add(layer.points, layer.hitSphere);
    shieldLayers.push(layer);
  }
  const glow = new Array(SHIELD_LAYERS).fill(0); // current glow strength per layer
  const pulseStart = new Array(SHIELD_LAYERS).fill(null);
  let hoveredLayer = -1;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(shieldLayers.map((l) => l.hitSphere));
    hoveredLayer = hits.length ? hits[0].object.userData.shieldLayerIndex : -1;
  }

  function onPointerDown() {
    if (hoveredLayer >= 0) pulseStart[hoveredLayer] = performance.now();
  }

  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mousedown', onPointerDown);

  // HOLOGRAPHIC THREAT MAP -> rotating wireframe globe with blips
  const { group: threatGlobe, wireGlobe } = createThreatGlobe(THREE);
  scene.add(threatGlobe);

  // HOLOGRAPHIC DATA PANELS (procedural canvas readouts)
  const holoPanels = [
    createHoloPanel(THREE, 'THREATS BLOCKED', '14,392'),
    createHoloPanel(THREE, 'AGENTS ACTIVE', '14 / 14'),
    createHoloPanel(THREE, 'UPTIME', '99.98%'),
  ];
  holoPanels[0].position.set(-4.5, 4.2, -2);
  holoPanels[0].rotation.y = 0.4;
  holoPanels[1].position.set(4.5, 4.2, -2);
  holoPanels[1].rotation.y = -0.4;
  holoPanels[2].position.set(0, 6.4, -3.5);
  holoPanels.forEach((p) => scene.add(p));

  // ANIMATION LOOP
  function update() {
    const now = Date.now();
    const corePulse = (Math.sin(now * 0.0012) + 1) / 2; // 0..1
    const coreColor = lerpColorHex(BLUE, PINK, corePulse);
    threatCore.material.color.setHex(coreColor);
    threatCore.material.emissive.setHex(coreColor);
    threatCore.rotation.y += 0.01;
    threatCore.rotation.x += 0.005;

    nodes.forEach((n, i) => {
      n.position.y += Math.sin(now * 0.001 + i) * 0.002;
    });

    shieldLayers.forEach((layer, i) => {
      const target = i === hoveredLayer ? 1 : 0;
      glow[i] += (target - glow[i]) * 0.12;

      let pulseScale = 1;
      if (pulseStart[i] != null) {
        const elapsed = (performance.now() - pulseStart[i]) / 600;
        if (elapsed >= 1) {
          pulseStart[i] = null;
        } else {
          pulseScale = 1 + Math.sin(elapsed * Math.PI) * 0.18;
        }
      }

      layer.points.material.opacity = layer.baseOpacity + glow[i] * 0.5;
      layer.points.material.size = layer.baseSize + glow[i] * 0.05;
      layer.points.scale.setScalar(pulseScale);
      layer.points.rotation.y += 0.0015 * (i % 2 === 0 ? 1 : -1);
      layer.hitSphere.rotation.copy(layer.points.rotation);
    });

    threatGlobe.rotation.y += 0.0025;
    wireGlobe.rotation.x += 0.0008;

    holoPanels.forEach((p, i) => {
      p.position.y += Math.sin(now * 0.0015 + i) * 0.0015;
    });
  }

  function dispose() {
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mousedown', onPointerDown);
  }

  return {
    scene,
    camera,
    update,
    dispose,
  };
}
