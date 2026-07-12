/**
 * omni-guard-site/empire/floor-registry.js
 *
 * Production-domain trimmed copy of empire/floor-registry.js — registers
 * ONLY the OmniGuard scene. The source registry also carries Floor 9
 * (PrimeDox AI HQ), a different brand under CLAUDE.md's zero-bleed rule;
 * that floor and its module are deliberately not copied onto omniaguard.com.
 */

const REGISTRY = {
  1: {
    loader: () => import('./floors/floor4-omniguard.js'),
    exportName: 'createOmniGuardScene',
    label: 'OmniGuard',
  },
};

const sceneCache = new Map();

export function getRegisteredFloors() {
  return Object.keys(REGISTRY).map(Number).sort((a, b) => a - b);
}

export function getFloorLabel(floorNumber) {
  return REGISTRY[floorNumber]?.label ?? null;
}

export function isFloorLoaded(floorNumber) {
  return sceneCache.has(floorNumber);
}

export async function loadFloorScene(floorNumber, THREE) {
  if (sceneCache.has(floorNumber)) return sceneCache.get(floorNumber);

  const entry = REGISTRY[floorNumber];
  if (!entry) {
    throw new Error(`floor-registry: no scene registered for floor ${floorNumber}`);
  }

  const mod = await entry.loader();
  const factory = mod[entry.exportName];
  if (typeof factory !== 'function') {
    throw new Error(`floor-registry: "${entry.exportName}" not exported from floor ${floorNumber} module`);
  }

  const built = factory(THREE);
  sceneCache.set(floorNumber, built);
  return built;
}

export default { getRegisteredFloors, getFloorLabel, isFloorLoaded, loadFloorScene };
