/* Shared geometry for the tower — kept out of the component files so fast
   refresh keeps working. */

/* Head office: one storey per project, glazed on all
   four sides so there is always a lit window facing the camera however far
   round it has flown. */
export const FLOOR_H = 2.75;     // storey height
export const TOWER_W = 4.3;      // slab width
export const TOWER_D = 3.4;      // slab depth
export const BASE_Y = 1.6;       // the first storey's centre

export const floorY = (indexFromBottom) => BASE_Y + indexFromBottom * FLOOR_H;

/* top of the whole stack, for the roof and the camera's ceiling */
export const towerTop = (floors) => floorY(floors - 1) + FLOOR_H / 2;

/* Small deterministic PRNG so the particle field is identical on every
   render — no impure calls during render, no flicker on fast refresh. */
export function rng(seed = 20260816) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------
   THE MAP
   The projects stand on a ring around head office. The
   camera's heading is measured against these bearings, so
   flying round the ring and choosing a project are the same
   gesture.
--------------------------------------------------------- */
export const RING = 28;
export const HQ_SCALE = 1.35;
export const bearingOf = (index, total) => (index / total) * Math.PI * 2;

/* Where a project's venue stands. The camera needs this as much as the
   scene does: flying to a project means moving what the camera orbits. */
export function venueAt(index, total, out) {
  const b = bearingOf(index, total);
  const x = Math.sin(b) * RING;
  const z = Math.cos(b) * RING;
  if (out) return out.set(x, 0, z);
  return [x, 0, z];
}
