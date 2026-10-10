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

/* =========================================================
   THE STREET
   ---------------------------------------------------------
   One road, laid out as a square block with head office in
   the middle of it. You start outside the front door, fly
   forward, and the road turns — so the whole map is "up the
   street, right at the end, carry on".

   The four venues sit along it, set back off the kerb and
   facing the traffic, alternating sides: the first on your
   right, the next on your left, and so on. Nothing is
   arranged in a ring any more and nothing is orbited; you
   pass things, which is the point.

   Everything below is measured in distance along that road,
   so "fly me to Pokellectr" and "keep going" are the same
   number moving.
   ========================================================= */
export const HQ_SCALE = 1.35;

export const ROAD = 36;          // half the block: the road runs x,z = +/-36
export const SETBACK = 18;       // how far off the kerb a venue is built
export const LEG = ROAD * 2;     // the length of one side
export const PERIM = LEG * 4;

/* Where you are when you are this far along the road. The block is square,
   so each quarter is one straight run and the joins are the corners. */
export function roadAt(s, y, out) {
  const d = ((s % PERIM) + PERIM) % PERIM;
  const leg = Math.floor(d / LEG);
  const u = (d % LEG) - ROAD;            // -ROAD..ROAD along this side
  if (leg === 0) return out.set(u, y, ROAD);
  if (leg === 1) return out.set(ROAD, y, -u);
  if (leg === 2) return out.set(-u, y, -ROAD);
  return out.set(-ROAD, y, u);
}

/* Which way the road is pointing there. */
export function roadDir(s, out) {
  const d = ((s % PERIM) + PERIM) % PERIM;
  const leg = Math.floor(d / LEG);
  if (leg === 0) return out.set(1, 0, 0);
  if (leg === 1) return out.set(0, 0, -1);
  if (leg === 2) return out.set(-1, 0, 0);
  return out.set(0, 0, 1);
}

/* How far round a corner you are, 0 down a straight and 1 at the turn —
   used to slow down into bends and to swing the craft round them. */
export function cornerAt(s, within = 11) {
  const d = ((s % PERIM) + PERIM) % PERIM;
  const toCorner = Math.abs(((d % LEG) + LEG) % LEG - LEG);
  const near = Math.min(d % LEG, LEG - (d % LEG), toCorner);
  return Math.max(0, 1 - near / within);
}

/* The point on the road each venue stands beside: the middle of its side. */
export const venueS = (index) => index * LEG + ROAD;

/* Which side of the road it is built on. Travelling the block this way,
   the outside of the bend is your right and the inside is your left, so
   alternating in and out puts them alternately right, left, right, left. */
export const venueOutside = (index) => index % 2 === 0;

/* Where it stands. Off the kerb at the middle of its side, outward for the
   ones on your right and in towards head office for the ones on your left. */
export function venueAt(index, total, out) {
  const away = venueOutside(index) ? SETBACK : -SETBACK;
  const r = ROAD + away;
  const leg = index % 4;
  const v =
    leg === 0 ? [0, r] : leg === 1 ? [r, 0] : leg === 2 ? [0, -r] : [-r, 0];
  if (out) return out.set(v[0], 0, v[1]);
  return [v[0], 0, v[1]];
}

/* Turned to face the traffic going past it. */
export function venueFacing(index) {
  const leg = index % 4;
  const outward = leg === 0 ? [0, 1] : leg === 1 ? [1, 0] : leg === 2 ? [0, -1] : [-1, 0];
  const sign = venueOutside(index) ? -1 : 1;    // outside ones look back inward
  return Math.atan2(outward[0] * sign, outward[1] * sign);
}
