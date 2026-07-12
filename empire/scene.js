/**
 * empire/scene.js
 *
 * The building shell: a generic lobby (with sliding elevator doors) plus an
 * elevator state machine that swaps the "active" {scene, camera, update}
 * triple between the lobby and whichever floor scene was requested, via
 * floor-registry.js. engine.js calls getActive() every frame and renders
 * whatever this returns — it has no knowledge of floors or transitions.
 */

import { loadFloorScene, getFloorLabel } from './floor-registry.js';
import { generateFallbackHDRI } from './fallbacks/HDRIFallback.js';

const DOOR_OPEN_OFFSET = 1.1;
const DOOR_HALF_TRANSITION_MS = 900; // 0.9s per-direction slide, per brushed-steel door spec
const DOOR_HALF_WIDTH = 0.75; // == doorGeo width/2 exactly, so closed doors touch with zero seam

// Approximates cubic-bezier(0.65, 0, 0.35, 1) — a smooth mechanical ease-in-out,
// no easing library dependency required for a single curve.
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Procedural brushed-steel grain: a normal map built from horizontal-row noise
// (no external texture asset). Used with MeshPhysicalMaterial.anisotropy to fake
// the directional micro-scratches of real brushed stainless steel.
function createBrushedSteelNormalMap(THREE) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const jitter = Math.round(Math.random() * 36 - 18);
    ctx.fillStyle = `rgb(${128 + jitter},128,255)`;
    ctx.fillRect(0, y, size, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 6);
  return texture;
}

function buildLobby(THREE) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 5, 50);
  scene.background = new THREE.Color(0x000000);
  // Procedural HDR-style environment (zero external .hdr asset) so the brushed
  // steel doors get real reflections — same fallback generator AssetLoader uses
  // per-floor, reused here for the lobby/elevator shell. OmniGuard blue accent
  // since this is the brand permitted to use blue/pink per CLAUDE.md.
  scene.environment = generateFallbackHDRI(THREE, { themeColor: '#4A90E2', floor: 'lobby' });

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 10);

  const ambient = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambient);

  const gold = new THREE.PointLight(0xd4af37, 1.5, 40);
  gold.position.set(0, 6, 4);
  scene.add(gold);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.5, roughness: 0.3 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const doorMat = new THREE.MeshPhysicalMaterial({
    color: 0xb8bcc2,
    metalness: 1,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2,
    normalMap: createBrushedSteelNormalMap(THREE),
    normalScale: new THREE.Vector2(0.12, 0.12),
  });
  if ('anisotropy' in doorMat) {
    doorMat.anisotropy = 1;
    doorMat.anisotropyRotation = Math.PI / 2; // vertical brushed grain, matches real elevator doors
  }
  const doorGeo = new THREE.BoxGeometry(DOOR_HALF_WIDTH * 2, 4, 0.1);
  const doorLeft = new THREE.Mesh(doorGeo, doorMat);
  const doorRight = new THREE.Mesh(doorGeo, doorMat);
  doorLeft.position.set(-DOOR_HALF_WIDTH, 2, -3);
  doorRight.position.set(DOOR_HALF_WIDTH, 2, -3);
  scene.add(doorLeft, doorRight);

  function update() {
    gold.intensity = 1.3 + Math.sin(Date.now() * 0.0015) * 0.2;
  }

  return { scene, camera, update, doors: { left: doorLeft, right: doorRight } };
}

class EventBus {
  constructor() {
    this._listeners = new Map();
  }
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  }
  emit(event, payload) {
    this._listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[SkyscraperBuilding] listener for "${event}" threw:`, err);
      }
    });
  }
}

export class SkyscraperBuilding {
  constructor(THREE) {
    this.THREE = THREE;
    this.lobby = buildLobby(THREE);
    this.active = this.lobby;
    this.currentFloor = null;
    this.transitioning = false;
    this.events = new EventBus();
    // Doors are built closed (offset 0) — track the real offset so
    // _animateDoors always eases from where the doors actually are,
    // never from an assumed state.
    this._doorOffset = 0;
  }

  on(event, fn) {
    return this.events.on(event, fn);
  }

  getActive() {
    return this.active;
  }

  async _animateDoors(open) {
    const { left, right } = this.lobby.doors;
    return new Promise((resolve) => {
      const start = performance.now();
      const fromOffset = this._doorOffset;
      const toOffset = open ? DOOR_OPEN_OFFSET : 0;
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / DOOR_HALF_TRANSITION_MS);
        const offset = fromOffset + (toOffset - fromOffset) * easeInOutCubic(t);
        left.position.x = -DOOR_HALF_WIDTH - offset;
        right.position.x = DOOR_HALF_WIDTH + offset;
        this._doorOffset = offset;
        if (t < 1) requestAnimationFrame(step);
        else {
          this._doorOffset = toOffset;
          resolve();
        }
      };
      step();
    });
  }

  async goToFloor(floorNumber) {
    if (this.transitioning || floorNumber === this.currentFloor) return;

    this.transitioning = true;
    this.events.emit('elevator:doors-closing', { floor: floorNumber });
    this.active = this.lobby;
    await this._animateDoors(false);

    this.events.emit('elevator:loading', { floor: floorNumber, label: getFloorLabel(floorNumber) });

    let floorScene;
    try {
      floorScene = await loadFloorScene(floorNumber, this.THREE);
    } catch (err) {
      this.events.emit('elevator:error', { floor: floorNumber, error: err });
      await this._animateDoors(true);
      this.transitioning = false;
      return;
    }

    if (floorScene.scene && !floorScene.scene.environment) {
      floorScene.scene.environment = this.lobby.scene.environment;
    }
    this.active = floorScene;
    this.currentFloor = floorNumber;
    this.events.emit('elevator:doors-opening', { floor: floorNumber, label: getFloorLabel(floorNumber) });
    await this._animateDoors(true);
    this.transitioning = false;
    this.events.emit('elevator:arrived', { floor: floorNumber, label: getFloorLabel(floorNumber) });
  }

  async returnToLobby() {
    if (this.transitioning || this.currentFloor === null) return;

    this.transitioning = true;
    this.events.emit('elevator:doors-closing', { floor: null });
    await this._animateDoors(false);

    this.active = this.lobby;
    this.currentFloor = null;
    this.events.emit('elevator:doors-opening', { floor: null, label: 'Lobby' });
    await this._animateDoors(true);
    this.transitioning = false;
    this.events.emit('elevator:arrived', { floor: null, label: 'Lobby' });
  }
}

export default SkyscraperBuilding;
