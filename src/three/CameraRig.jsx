import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { gesture } from "./gesture";
import { flight, input } from "./flight";
import {
  CRAFT_AHEAD,
  CRAFT_HOVER,
  HQ_FACING,
  HQ_S,
  PERIM,
  cornerAt,
  hqAt,
  roadAt,
  venueAt,
  venueFacing,
  venueOutside,
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
     drag sideways    the same as left / right
     a tap, a window  fly up the road to that one

   Nothing that feels like scrolling moves you: not the wheel,
   not a swipe up the screen, not reading down a write-up.
   People scroll out of habit, and the street lurching under
   them when they did was the most confusing thing on the
   site. The GO and back buttons are how you travel.

   Opening a project is the same number moving: it drives up
   to that frontage and parks.
   ========================================================= */

/* The tour never stops on its own. It used to stand down whenever the
   pointer moved or rested on a building — and on a laptop the pointer sits
   in the middle of the street, so the whole city looked frozen. Now it is
   always going, and the buttons change how: GO adds to the cruise, back
   puts it in reverse, and letting go eases it back to the cruise. */
const CRUISE = 20;            // the tour's own pace

/* A phone shows a narrow slice of the street, so the same speed across the
   ground goes past far faster than it does on a desktop — and a thumb on a
   throttle is a blunter instrument than a held key. Everything that moves
   you is wound back on a small screen. */
const PHONE_PACE = 0.55;
const PUSH = 52;              // what GO adds, and how fast back goes
const HOLD = 2.5;             // a pause outside a place you picked yourself
const DRAG_LOOK = 2.2;

const EYE = 9.5;              // how high off the road
const EYE_MIN = 4;
const EYE_MAX = 30;

/* The glance at a frontage as you go past. It is a turn of the head, not a
   change of subject: the camera is following the craft, and swinging all the
   way onto a building threw the craft out of shot and left you watching
   scenery. So it is capped — and the cap is smaller on a phone, which has
   far less width to spend before the craft is off the edge of it. */
const GLANCE = 74;            // from this far out it starts turning its head
/* Full by the time you are where the camera pulls up, not by the time you
   are level with the place: level, it is square on your side and the cap
   cannot reach it anyway, so a ramp that peaked there peaked too late to
   be any use. */
const LEVEL = 40;
const BEHIND = 26;            // then it straightens up again over this much
const HQ_PULL = 1.8;          // how much harder head office has to be nearest

/* Going past a place, the camera leaves the kerb and swings round square in
   front of it, then back onto the road once it is behind you. Craning from
   the road could only ever give you an oblique look at a frontage — the one
   angle from which a lit board is hardest to read. */
const STANDOFF = 40;          // how far out it stands when it is square on
const SWING = 0.85;           // and how far round it is allowed to come

/* How far the camera will crane to look at a frontage. A phone needs far
   more of it, not less: its lens is so narrow that a small turn never got
   the building on screen at all, so going past one looked like going past
   nothing. It costs the craft the middle of the frame for a second or two,
   which is the right trade — that second is the whole point of the street. */
const GLANCE_WIDE = 0.8;
const GLANCE_NARROW = 0.92;

/* And the lens itself opens up when the screen is tall and thin. */
const FOV_WIDE = 55;
const FOV_NARROW = 68;

/* Head office is a frontage on the street now rather than the thing in the
   middle, so there is no standing lean towards the block and no opening hold
   on the tower. You land already coming up on the first project, and the
   tower is something you pass — last, on the way back round. */
const LOOK_MAX = 1.15;        // how far you can crane round, in radians
const ARROW_LOOK = 1.1;
const RESUME_AFTER = 3.4;

const APPROACH = 32;          // where it pulls up when you pick one
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
const _tower = new THREE.Vector3();
const _base = new THREE.Vector3();
const _stop = new THREE.Vector3();
const _front = new THREE.Vector3();

export default function CameraRig({
  mode,
  focusIndex,
  total,
  pickIndex,
  onFeature,
  onStop,
  reduced = false,
}) {
  const { camera, gl } = useThree();

  const state = useRef({
    /* exactly where the camera pulls up for the first frontage, so the
       tour opens on CompKit rather than on anything else */
    s: venueS(0) - APPROACH,
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
    pointerId: null,
    glance: 0,                  // how far the head is turned to a frontage
    featured: -1,
    hold: 0,                    // seconds left sitting outside a pick
    stop: null,                 // what the guide is talking about
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
      s.lastX = e.clientX;
      s.lastY = e.clientY;
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

      /* Sideways turns your head, and that is all a drag does. Up and down
         used to drive you along the street, which on a phone meant every
         attempt to scroll the page sent you flying past the work. */
      const dLook = (dx / window.innerWidth) * DRAG_LOOK;
      s.tLook = clamp(s.tLook + dLook, -LOOK_MAX, LOOK_MAX);
    };

    const up = () => {
      s.dragging = false;
      if (s.pointerId != null) el.releasePointerCapture?.(s.pointerId);
      s.pointerId = null;
      el.classList.remove("is-dragging");
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

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
    /* Stop short of it, not level with it. Level, a frontage is square on
       your left or right - ninety degrees - and the camera is only allowed
       to crane a third of that, so pulling up outside one actually left it
       off the edge of the screen. From a little way back it sits where the
       camera can look straight at it. */
    s.flyTo = venueS(pickIndex) - APPROACH;
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
    const wide = frame.viewport.aspect > 1.25;
    const pace = wide ? 1 : PHONE_PACE;

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
      hqAt(_tower);
      const rx = _craft.x - _tower.x;
      const rz = _craft.z - _tower.z;
      const out = Math.hypot(rx, rz) || 1;
      const ox = (rx / out) * 10 * spin;
      const oz = (rz / out) * 10 * spin;

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
      camera.lookAt(
        tx + (_tower.x - tx) * w,
        ty + (TOWER_MID - ty) * w,
        tz + (_tower.z - tz) * w
      );

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
      /* the arrival winds round head office, so that is where the guide
         starts: the introduction */
      reportStop(st, "hq", onStop);
      publish(st);
      return;
    }
    st.intro = null;
    flight.intro = null;

    /* ---- how far along the road ---------------------------------------- */
    if (mode === "project" && focusIndex >= 0) {
      /* Parked outside it, and it stays parked while you read. The camera
         used to slide along and climb as the write-up scrolled, which made
         reading feel like being driven somewhere. */
      const park = venueS(focusIndex) - PARK_BACK;
      st.s += shortest(st.s, park) * Math.min(1, dt * 2.3);
      st.tEye = 8;
      st.tLook = 0;
      st.speed = 0;
    } else {
      st.idle += dt;

      if (st.flyTo != null) {
        /* driving itself to a frontage */
        const gap = shortest(st.s, st.flyTo);
        st.s += gap * Math.min(1, dt * (wide ? 2.3 : 1.5));
        st.speed = 0;
        st.idle = 0;
        if (Math.abs(gap) < 0.6) {
          st.flyTo = null;
          st.hold = HOLD;        // sit outside it a moment before moving on
        }
      } else {
        /* The cruise, unless a button says otherwise. Someone who has asked
           for reduced motion gets no cruise, but the buttons still work. */
        let want = reduced ? 0 : CRUISE;
        if (st.hold > 0) {
          st.hold -= dt;
          want = 0;
        }
        if (input.climb > 0) want = CRUISE + PUSH;
        else if (input.climb < 0) want = -PUSH;
        if (input.climb) {
          st.idle = 0;
          st.hold = 0;
        }
        /* eased rather than switched, so a press is a surge and a release
           settles back into the tour instead of lurching */
        st.speed = damp(st.speed, want * pace, input.climb ? 3 : 1.6, dt);

        /* slow into the bends, the way anything with mass would */
        const bend = 1 - cornerAt(st.s) * 0.45;
        st.s += st.speed * bend * dt;
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
       front of you rather than flicking back as you clear a frontage. In
       reverse, "in front" is the other way. */
    const ahead = st.speed < -0.5 ? -1 : 1;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < total; i++) {
      const d = shortest(st.s, venueS(i)) * ahead;
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

    st.eye = damp(st.eye, st.tEye, 3.5, dt);
    roadAt(st.s, st.eye, _here);

    /* What the camera is actually following is the craft: it is a little
       way up the road, it rounds every corner before the camera does, and
       looking just past it keeps it in shot and the bend anticipated. */
    roadAt(st.s + CRAFT_AHEAD + 9, CRAFT_HOVER + 1.4, _road);

    /* and nothing leans it off that: what the camera follows is the craft,
       and the only thing that turns its head is going past a frontage */
    _base.copy(_road);

    /* Which frontage the head is turned towards — the projects and head
       office alike, because on the street it is another building you go
       past. Only the projects are ever named in the bar; this is just
       where the camera is looking. */
    let look = venueS(st.featured);
    let lookAt = st.featured;
    if (mode !== "project") {
      /* A project wins unless head office is a good deal nearer: the point
         of the street is the work, and the tower pulling the camera off a
         frontage that was about to come up is exactly what it must not do. */
      const score = (d) => (d * ahead >= 0 ? d * ahead : -d * ahead * 2.2);
      if (score(shortest(st.s, HQ_S)) * HQ_PULL < score(shortest(st.s, look))) {
        look = HQ_S;
        lookAt = -1;
      }
    }

    /* Builds as you come up on it and falls away once it is behind you,
       rather than being symmetrical: nobody cranes back over their shoulder
       at a shop they have already gone past. Which way is "coming up"
       depends on which way you are going. */
    const gap = shortest(st.s, look) * ahead;
    const g =
      gap >= 0
        ? clamp((GLANCE - gap) / (GLANCE - LEVEL), 0, 1)
        : clamp(1 + gap / BEHIND, 0, 1);
    const glance = g * g * (3 - 2 * g);

    /* What the tour guide is talking about: head office while the camera is
       turned to it, otherwise the place you are coming up on. */
    if (mode !== "project") {
      reportStop(st, lookAt < 0 && glance > 0.15 ? "hq" : st.featured, onStop);
    }

    /* and where that frontage actually stands */
    if (lookAt < 0) {
      hqAt(_stop);
      _stop.y = 15;             // halfway up it, not at its feet
    } else {
      venueAt(lookAt, total, _stop);
      /* up where the boards and signs are, not at the kerb: aiming at its
         feet pushed everything worth seeing above the top of the frame */
      _stop.y = 9.5;
    }

    if (mode === "project") {
      /* a write-up is the one time the building really is the subject */
      _want.copy(_stop);
      st.glance = 0;
    } else {
      _want.copy(_base);
      const cap = wide ? GLANCE_WIDE : GLANCE_NARROW;
      const toVenue = Math.atan2(_stop.x - _here.x, _stop.z - _here.z);
      const toBase = Math.atan2(_want.x - _here.x, _want.z - _here.z);
      let swing = toVenue - toBase;
      while (swing > Math.PI) swing -= Math.PI * 2;
      while (swing < -Math.PI) swing += Math.PI * 2;
      st.glance = damp(st.glance, clamp(swing, -cap, cap) * glance, 4, dt);
    }

    /* Swing off the kerb to square up with it. At full swing the camera is
       standing in front of the frontage looking straight at it, so the crane
       is wound back out as it goes — otherwise the two would double up. */
    const yaw = lookAt < 0 ? HQ_FACING : venueFacing(lookAt);
    /* The two frontages inside the block face back across the road, so
       squaring up with one puts the camera on the far side of it — with the
       kerb and a row of lamp standards between the lens and the building.
       Rising above them is what clears the shot; standing closer instead
       would not fit the taller frontages in. */
    const inside = lookAt < 0 || !venueOutside(lookAt);
    _front.set(
      _stop.x + Math.sin(yaw) * STANDOFF,
      st.eye + (inside ? 5 : 0),
      _stop.z + Math.cos(yaw) * STANDOFF
    );
    const swing = mode === "project" ? 0 : glance * SWING;
    camera.position.lerpVectors(_here, _front, swing);

    /* the head you turned yourself, on top of that */
    st.look = damp(st.look, st.tLook, 3.2, dt);
    const head = st.look + st.glance * (1 - swing);
    if (!st.dragging && !input.turn && mode === "space" && st.idle > RESUME_AFTER) {
      st.tLook = damp(st.tLook, 0, 1.2, dt);
    }
    _dir.subVectors(_want, camera.position);
    /* No framing offset here on purpose: the hero copy owns the left of the
       screen and the project rail the right, which leaves the clear band more
       or less centred — so what the camera is looking at is already in it. */
    if (head) _dir.applyAxisAngle(UP, head);
    _dir.add(camera.position);
    /* and once it is square on, it looks straight at the thing rather than
       down a road it is no longer on */
    _dir.lerp(_stop, swing);
    st.target.lerp(_dir, 1 - Math.pow(0.0015, dt));
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
  hqAt(_tower);
  /* everything below is measured from the tower, wherever it stands */
  const dx = _end.x - _tower.x;
  const dz = _end.z - _tower.z;
  /* finish the circling pointed the same way as the run out, so peeling off
     is one clean line and not a hook back on itself */
  const aOut = Math.atan2(dx, dz);
  const aTop = aOut - TURNS * Math.PI * 2;

  if (p < DIVE) {
    const k = p / DIVE;
    const e = k * k;                            // falling, and getting faster
    const r = FROM.r + (SPIRAL_R - FROM.r) * e;
    return out.set(
      _tower.x + Math.sin(aTop) * r,
      FROM.y + (SPIRAL_TOP - FROM.y) * e,
      _tower.z + Math.cos(aTop) * r
    );
  }

  if (p < WIND) {
    const k = (p - DIVE) / (WIND - DIVE);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const a = aTop + TURNS * Math.PI * 2 * e;
    const y = SPIRAL_TOP + (SPIRAL_BOTTOM - SPIRAL_TOP) * e;
    return out.set(
      _tower.x + Math.sin(a) * SPIRAL_R,
      y,
      _tower.z + Math.cos(a) * SPIRAL_R
    );
  }

  /* peeling off: a curve that leaves along the way it was already going */
  const k = (p - WIND) / (1 - WIND);
  const e = k * (2 - k);
  const px = _tower.x + Math.sin(aOut) * SPIRAL_R;
  const pz = _tower.z + Math.cos(aOut) * SPIRAL_R;
  const cx = px + Math.cos(aOut) * 42;
  const cz = pz - Math.sin(aOut) * 42;
  const u = 1 - e;
  return out.set(
    u * u * px + 2 * u * e * cx + e * e * _end.x,
    u * u * SPIRAL_BOTTOM + 2 * u * e * (SPIRAL_BOTTOM + 2) + e * e * CRAFT_HOVER,
    u * u * pz + 2 * u * e * cz + e * e * _end.z
  );
}

/* only on a change, so the guide re-renders once per stop, not per frame */
function reportStop(st, stop, onStop) {
  if (stop === st.stop) return;
  st.stop = stop;
  onStop?.(stop);
}

/* what the craft needs to fly the same road */
function publish(st) {
  flight.s = st.s;
  flight.speed = st.speed;
  flight.eye = st.eye;
}
