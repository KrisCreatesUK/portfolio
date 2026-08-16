/* Shared geometry for the array — kept out of the component files so fast
   refresh keeps working. */

export const DRIVE_W = 3.2;
export const DRIVE_D = 2.1;
export const DRIVE_H = 0.62;
export const PITCH = 1.06;
export const BASE_Y = 0.62;

export const driveY = (indexFromBottom) => BASE_Y + indexFromBottom * PITCH;

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
