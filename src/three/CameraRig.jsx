import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { gesture } from "./gesture";
import { flight, input } from "./flight";
import {
  CRAFT_AHEAD,
  CRAFT_HOVER,
  PERIM,
  cornerAt,
  roadAt,
  venueAt,
  venueS,
} from "./layout";

/* =========================================================
   CAMERA
   ---------------------------------------------------------
   You are on the road, not above the map. Everything the
   camera knows is one number — how far along the street it
   has got — and the street is a block with head office in
   the middle of it, so flying forward eventually puts you
   round a corner and into the next stretch.

   The venues are built along it, alternating sides. As you
   draw level with one the camera turns its head to look at
   it and turns back once it is behind you, the way you would
   actually look at a shop you were passing.

     forward / back   fly up the street, or back down it
     left / right     look across at what you are passing
     drag             the same two, together
     wheel            forward and back
     a tap, a window  fly up the road to that one

   Opening a project is the same number moving: it drives up
   to that frontage and parks.
   ========================================================= */

const CRUISE = 14;            // drifting along when left alone
const PUSH = 52;              // units a second with forward held
const DRAG_FWD = 210;         // how far a full-screen drag carries you
const DRAG_LOOK = 2.2;
const FLING_DECAY = 0.08;

const EYE = 9.5;              // how high off the road
const EYE_MIN = 4;
const EYE_MAX = 30;

/* The glance at a frontage as you go past. It is a turn of the head, not a
   change of subject: the camera is following the craft, and swinging all the
   way onto a building threw the craft out of shot and left you watching
   scenery. So it is capped — and the cap is smaller on a phone, which has
   far less width to spend before the craft is off the edge of it. */
const GLANCE = 52;            // from this far out it starts turning its head
const LEVEL = 8;              // and from this close the turn is at full
const BEHIND = 26;            // then it straightens up again over this much

/* How far the camera will crane to look at a frontage. A phone needs far
   more of it, not less: its lens is so narrow that a small turn never got
   the building on screen at all, so going past one looked like going past
   nothing. It costs the craft the middle of the frame for a second or two,
   which is the right trade — that second is the whole point of the street. */
const GLANCE_WIDE = 0.62;
const GLANCE_NARROW = 0.92;

/* And the lens itself opens up when the screen is tall and thin. */
const FOV_WIDE = 55;
const FOV_NARROW = 68;

/* Head office gets the view entirely while you are still parked outside the
   front door, and none of it once you pull away: any standing lean towards
   the middle of the block turns the camera off the road, and the craft ends
   up pinned to one side of the screen instead of out in front of you. */
const INWARD = 0;

/* You start outside the front door looking up at it, and pull away onto the
   road once you touch something or after a few seconds of standing there —
   because head office is where the whole thing starts from. */
const HOLD = 4.5;
const LOOK_MAX = 1.15;        // how far you can crane round, in radians
const ARROW_LOOK = 1.1;
const RESUME_AFTER = 3.4;

const PARK_BACK = 15;         // where it stops relative to a frontage

/* =========================================================
   THE ARRIVAL
   ---------------------------------------------------------
   The craft comes down out of the sky, winds round the tower
   on the way, and levels out over the road with the tour
   ahead of it. You watch all of it from behind.

   The last frame of it is exactly where the craft rides for
   the rest of the tour and exactly where the camera sits to
   follow it, so nothing jumps when the fly-in lets go.
   ========================================================= */
const INTRO_DUR = 6.6;

/* Kept short: above the rooftops there is nothing to look at, so the city
   should be under you almost immediately. */
const DIVE = 0.2;             // the share of it spent falling
const WIND = 0.74;            // and the share by which it has stopped circling
const TURNS = 2;              // how many times round the tower
const FROM = { r: 150, y: 170 };

/* Close in. The point is to be going round the tower, past its windows,
   rather than describing a wide arc somewhere near it — at forty units out
   it read as circling the whole block instead. */
const SPIRAL_R = 20;
const SPIRAL_TOP = 46;
const SPIRAL_BOTTOM = 13;
const TOWER_MID = 19;         // roughly halfway up head office
const CHASE_FAR = 13;         // how far behind the craft, at the top
const LIFT_FAR = 4.5;

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
const damp = THREE.MathUtils.damp;

/* the short way round the block from one distance to another */
function shortest(from, to) {
  let d = (to - from) % PERIM;
  if (d > PERIM / 2) d -= PERIM;
  if (d < -PERIM / 2) d += PERIM;
  return d;
}

const _here = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _venue = new THREE.Vector3();
const _road = new THREE.Vector3();
const _want = new THREE.Vector3();
const _craft = new THREE.Vector3();
const _end = new THREE.Vector3();
const _base = new THREE.Vector3();
const _hq = new THREE.Vector3(0, 15, 0);

export default function CameraRig({
  mode,
  focusIndex,
  total,
  progressRef,
  pointing,
  pickIndex,
  onFeature,
  reduced = false,
}) {
  const { camera, gl } = useThree();

  const state = useRef({
    /* a short way back down the road from the first frontage, which is both
       what the bar should be showing and where the tower reads best */
    s: venueS(0) - 62,
    speed: 0,
    flyTo: null,                // a distance it is driving itself to
    look: 0,                    // how far the head is turned, radians
    tLook: 0,
    eye: EYE,
    tEye: EYE,
    target: new THREE.Vector3(),
    intro: 0,
    idle: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    vFwd: 0,
    vLook: 0,
    pointerId: null,
    hq: 1,                      // 1 while still looking up at head office
    glance: 0,                  // how far the head is turned to a frontage
    featured: -1,
  });

  /* ---- fly it yourself ------------------------------------------------ */
  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;

    const down = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      s.dragging = true;
      s.idle = 0;
      s.intro = null;
      s.flyTo = null;
      gesture.moved = 0;
      s.vFwd = 0;
      s.vLook = 0;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.lastT = e.timeStamp || performance.now();
      el.setPointerCapture?.(e.pointerId);
      s.pointerId = e.pointerId;
      el.classList.add("is-dragging");
    };

    const move = (e) => {
      s.idle = 0;
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      gesture.moved += Math.hypot(dx, dy);

      /* sideways turns your head, up and down drives. Drag carries the
         scene with the finger rather than steering against it. */
      const dLook = (dx / window.innerWidth) * DRAG_LOOK;
      const dFwd = (dy / window.innerHeight) * DRAG_FWD;

      s.tLook = clamp(s.tLook + dLook, -LOOK_MAX, LOOK_MAX);
      s.s += dFwd;

      const now = e.timeStamp || performance.now();
      const ms = Math.max(8, now - s.lastT);
      s.lastT = now;
      s.vFwd = (dFwd / ms) * 1000;
      s.vLook = (dLook / ms) * 1000;
    };

    const up = () => {
      s.dragging = false;
      if (s.pointerId != null) el.releasePointerCapture?.(s.pointerId);
      s.pointerId = null;
      el.classList.remove("is-dragging");
    };

    const wheel = (e) => {
      if (mode !== "space") return;
      e.preventDefault();
      s.idle = 0;
      s.flyTo = null;
      s.s += e.deltaY * 0.13;
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl, mode]);

  /* ---- the lens -------------------------------------------------------
     Wider on a tall thin screen, where a normal one shows so narrow a slice
     of the street that going past a building barely registers. */
  useEffect(() => {
    const fit = () => {
      const fov = window.innerWidth / window.innerHeight > 1.25 ? FOV_WIDE : FOV_NARROW;
      /* Set through the lens rather than by writing camera.fov: the compiler
         treats anything out of useThree as read-only, and this is the method
         three gives you for it — it updates the projection itself. */
      const slope = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
      camera.setFocalLength((0.5 * camera.getFilmHeight()) / slope);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [camera]);

  /* ---- a venue was picked: drive up the road to it --------------------- */
  useEffect(() => {
    if (pickIndex == null || mode !== "space") return;
    const s = state.current;
    s.flyTo = venueS(pickIndex);
    s.idle = 0;
    s.intro = null;
  }, [pickIndex, mode]);

  /* ---- entering or leaving a write-up ---------------------------------- */
  useEffect(() => {
    const s = state.current;
    if (mode === "project" && focusIndex >= 0) {
      s.flyTo = venueS(focusIndex) - PARK_BACK;
      s.tEye = 8;
    } else {
      s.flyTo = null;
      s.tEye = EYE;
    }
    s.idle = 0;
  }, [mode, focusIndex]);

  useFrame((frame, delta) => {
    const st = state.current;
    const dt = Math.min(delta, 0.05);

    /* ---- the arrival ---------------------------------------------------
       Timed off the clock, not off accumulated frame deltas: dt is clamped
       so a stutter cannot fling the camera, which means on a slow device the
       deltas stop adding up to real seconds. */
    if (st.intro !== null && mode === "space" && !reduced) {
      if (!st.intro) st.intro = frame.clock.elapsedTime;
      const p = clamp((frame.clock.elapsedTime - st.intro) / INTRO_DUR, 0, 1);

      arrivalAt(p, st.s, _craft);
      arrivalAt(Math.min(1, p + 0.01), st.s, _ahead);
      _dir.subVectors(_ahead, _craft);
      if (_dir.lengthSq() < 1e-6) _dir.set(0, 0, 1);
      _dir.normalize();

      /* the chase closes up as it comes down, finishing exactly where the
         camera rides behind the craft for the rest of the tour */
      const k = p * p * (3 - 2 * p);
      const back = CHASE_FAR + (CRAFT_AHEAD - CHASE_FAR) * k;
      const lift = LIFT_FAR + (EYE - CRAFT_HOVER - LIFT_FAR) * k;

      /* While it is going round, the camera stands off the outside of the
         turn and looks across the craft at the tower. Chasing straight down
         the tangent meant the tower was always just off to one side, so you
         watched a craft circling nothing in particular. */
      const spin =
        clamp((p - DIVE) / 0.09, 0, 1) * clamp((WIND + 0.1 - p) / 0.13, 0, 1);
      const out = Math.hypot(_craft.x, _craft.z) || 1;
      const ox = (_craft.x / out) * 10 * spin;
      const oz = (_craft.z / out) * 10 * spin;

      camera.position.set(
        _craft.x - _dir.x * back + ox,
        _craft.y - _dir.y * back + lift + 3 * spin,
        _craft.z - _dir.z * back + oz
      );

      const tx = _craft.x + _dir.x * 9;
      const ty = _craft.y + _dir.y * 9 + 1.8;
      const tz = _craft.z + _dir.z * 9;
      /* aim at the middle of the tower, not at the craft height: early in
         the turn the craft is well above the roof, and following its own
         altitude pointed the camera at empty sky over the top of it */
      const w = 0.78 * spin;
      camera.lookAt(tx + (0 - tx) * w, ty + (TOWER_MID - ty) * w, tz + (0 - tz) * w);

      /* hand the craft the seat the rig has flown it to */
      flight.intro = p;
      flight.sx = _craft.x;
      flight.sy = _craft.y;
      flight.sz = _craft.z;
      flight.syaw = Math.atan2(_dir.x, _dir.z);
      flight.sbank = p > DIVE && p < WIND + 0.1 ? 0.6 : 0;
      flight.flying = false;

      if (p >= 1) {
        st.intro = null;
        flight.intro = null;
      }
      publish(st);
      return;
    }
    st.intro = null;
    flight.intro = null;

    /* ---- how far along the road ---------------------------------------- */
    if (mode === "project" && focusIndex >= 0) {
      /* The write-up drives: how far you have read slides the camera past
         the frontage and lifts it, so the building moves while you read. */
      const p = clamp(progressRef?.current ?? 0, 0, 1);
      const park = venueS(focusIndex) - PARK_BACK + p * 26;
      st.s += shortest(st.s, park) * Math.min(1, dt * 2.3);
      st.tEye = 8 + p * 11;
      st.tLook = 0;
      st.speed = 0;
    } else {
      st.idle += dt;

      if (st.flyTo != null) {
        /* driving itself to a frontage */
        const gap = shortest(st.s, st.flyTo);
        st.s += gap * Math.min(1, dt * 2.3);
        st.speed = 0;
        st.idle = 0;
        if (Math.abs(gap) < 0.6) {
          st.flyTo = null;
          st.idle = -4;          // sit outside it a moment before moving on
        }
      } else {
        /* forward and back, held */
        if (input.climb) {
          st.idle = 0;
          st.speed = input.climb * PUSH;
        } else {
          st.speed = damp(st.speed, 0, 5, dt);
        }

        /* the throw: let go mid-drag and it keeps rolling */
        if (!st.dragging && Math.abs(st.vFwd) > 0.4) {
          st.s += st.vFwd * dt;
          st.vFwd *= Math.pow(FLING_DECAY, dt);
          st.idle = 0;
        }

        /* slow into the bends, the way anything with mass would */
        const bend = 1 - cornerAt(st.s) * 0.45;
        st.s += st.speed * bend * dt;

        const touring = !st.dragging && !pointing && !reduced && st.idle > RESUME_AFTER;
        if (touring) st.s += CRUISE * bend * dt;
      }

      /* looking across the street, held */
      if (input.turn) {
        st.idle = 0;
        st.tLook = clamp(st.tLook - input.turn * ARROW_LOOK * dt, -LOOK_MAX, LOOK_MAX);
      }
    }

    st.s = ((st.s % PERIM) + PERIM) % PERIM;

    /* ---- which one are we passing? ------------------------------------- */
    /* The one you are coming up on, not simply the nearest: something you
       have already gone past counts double, so the bar stays on what is in
       front of you rather than flicking back as you clear a frontage. */
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < total; i++) {
      const d = shortest(st.s, venueS(i));
      const score = d >= 0 ? d : -d * 2.2;
      if (score < best) {
        best = score;
        nearest = i;
      }
    }
    if (onFeature && nearest !== st.featured) {
      st.featured = nearest;
      onFeature(nearest);
    }
    if (mode === "project" && focusIndex >= 0) st.featured = focusIndex;

    /* ---- where the camera is, and what it is looking at ---------------- */
    const wide = frame.viewport.aspect > 1.25;

    st.eye = damp(st.eye, st.tEye, 3.5, dt);
    roadAt(st.s, st.eye, _here);
    camera.position.copy(_here);

    /* What the camera is actually following is the craft: it is a little
       way up the road, it rounds every corner before the camera does, and
       looking just past it keeps it in shot and the bend anticipated. */
    roadAt(st.s + CRAFT_AHEAD + 9, CRAFT_HOVER + 1.4, _road);

    /* Leaning into the block while you are still outside the front door,
       all the way onto it for the first few seconds before you pull away. */
    if (st.dragging || st.speed || st.flyTo != null || st.idle > HOLD) {
      st.hq = damp(st.hq, 0, 1.1, dt);
    }
    if (mode === "project") st.hq = 0;
    _base.lerpVectors(_road, _hq, INWARD + (0.92 - INWARD) * st.hq);

    /* and the glance: going past a frontage the head turns towards it and
       back again — as far as it is allowed to, and no further */
    venueAt(st.featured, total, _venue);
    _venue.y = 7;
    /* Builds as you come up on it and falls away once it is behind you,
       rather than being symmetrical: nobody cranes back over their shoulder
       at a shop they have already gone past. */
    const gap = shortest(st.s, venueS(st.featured));
    const g =
      gap >= 0
        ? clamp((GLANCE - gap) / (GLANCE - LEVEL), 0, 1)
        : clamp(1 + gap / BEHIND, 0, 1);
    const glance = g * g * (3 - 2 * g);

    if (mode === "project") {
      /* a write-up is the one time the building really is the subject */
      _want.copy(_venue);
      st.glance = 0;
    } else {
      _want.copy(_base);
      const cap = wide ? GLANCE_WIDE : GLANCE_NARROW;
      const toVenue = Math.atan2(_venue.x - _here.x, _venue.z - _here.z);
      const toBase = Math.atan2(_want.x - _here.x, _want.z - _here.z);
      let swing = toVenue - toBase;
      while (swing > Math.PI) swing -= Math.PI * 2;
      while (swing < -Math.PI) swing += Math.PI * 2;
      st.glance = damp(st.glance, clamp(swing, -cap, cap) * glance, 4, dt);
    }

    /* the head you turned yourself, on top of that */
    st.look = damp(st.look, st.tLook, 3.2, dt);
    const head = st.look + st.glance;
    if (!st.dragging && !input.turn && mode === "space" && st.idle > RESUME_AFTER) {
      st.tLook = damp(st.tLook, 0, 1.2, dt);
    }
    _dir.subVectors(_want, _here);
    /* No framing offset here on purpose: the hero copy owns the left of the
       screen and the volume rail the right, which leaves the clear band more
       or less centred — so what the camera is looking at is already in it. */
    if (head) _dir.applyAxisAngle(UP, head);
    st.target.lerp(_dir.add(_here), 1 - Math.pow(0.0015, dt));
    camera.lookAt(st.target);

    flight.flying = mode === "space";
    publish(st);
  });

  return null;
}

const UP = new THREE.Vector3(0, 1, 0);

/* Where the craft is, this far through the arrival.

   Three parts: out of the sky, twice round the tower close enough to be
   going past its windows, then peeling off down to the road. The last of
   those is a curve that ends on the exact spot the craft occupies in normal
   flight — landing on it, rather than being faded out somewhere near it, is
   what makes the hand-off invisible. */
function arrivalAt(p, s0, out) {
  roadAt(s0 + CRAFT_AHEAD, CRAFT_HOVER, _end);
  /* finish the circling pointed the same way as the road, so peeling off is
     one clean run outwards and not a hook back on itself */
  const aOut = Math.atan2(_end.x, _end.z);
  const aTop = aOut - TURNS * Math.PI * 2;

  if (p < DIVE) {
    const k = p / DIVE;
    const e = k * k;                            // falling, and getting faster
    const r = FROM.r + (SPIRAL_R - FROM.r) * e;
    return out.set(
      Math.sin(aTop) * r,
      FROM.y + (SPIRAL_TOP - FROM.y) * e,
      Math.cos(aTop) * r
    );
  }

  if (p < WIND) {
    const k = (p - DIVE) / (WIND - DIVE);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const a = aTop + TURNS * Math.PI * 2 * e;
    const y = SPIRAL_TOP + (SPIRAL_BOTTOM - SPIRAL_TOP) * e;
    return out.set(Math.sin(a) * SPIRAL_R, y, Math.cos(a) * SPIRAL_R);
  }

  /* peeling off: a curve that leaves along the way it was already going */
  const k = (p - WIND) / (1 - WIND);
  const e = k * (2 - k);
  const px = Math.sin(aOut) * SPIRAL_R;
  const pz = Math.cos(aOut) * SPIRAL_R;
  const cx = px + Math.cos(aOut) * 46;
  const cz = pz - Math.sin(aOut) * 46;
  const u = 1 - e;
  return out.set(
    u * u * px + 2 * u * e * cx + e * e * _end.x,
    u * u * SPIRAL_BOTTOM + 2 * u * e * (SPIRAL_BOTTOM + 2) + e * e * CRAFT_HOVER,
    u * u * pz + 2 * u * e * cz + e * e * _end.z
  );
}

/* what the craft needs to fly the same road */
function publish(st) {
  flight.s = st.s;
  flight.speed = st.speed;
  flight.eye = st.eye;
}
