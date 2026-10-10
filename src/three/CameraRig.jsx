import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { gesture } from "./gesture";
import { flight, input } from "./flight";
import { PERIM, cornerAt, roadAt, venueAt, venueS } from "./layout";

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

const CRUISE = 6.5;           // drifting along when left alone
const PUSH = 30;              // units a second with forward held
const DRAG_FWD = 150;         // how far a full-screen drag carries you
const DRAG_LOOK = 2.2;
const FLING_DECAY = 0.08;

const EYE = 9.5;              // how high off the road
const EYE_MIN = 4;
const EYE_MAX = 30;
const AHEAD = 26;             // how far down the road it looks
const RISE = 5.5;             // and how far above the tarmac

const GLANCE = 36;            // from this far out it starts turning its head
const LEVEL = 9;              // and from this close it is looking right at it

/* Head office stands in the middle of the block, which is always off to your
   left, so the default view leans into it. Without this you drive round the
   outside of your own building and never see it — and its windows are what
   you press to be taken somewhere. */
const INWARD = 0.2;

/* You start outside the front door looking up at it, and pull away onto the
   road once you touch something or after a few seconds of standing there —
   because head office is where the whole thing starts from. */
const HOLD = 4.5;
const LOOK_MAX = 1.15;        // how far you can crane round, in radians
const ARROW_LOOK = 1.1;
const RESUME_AFTER = 3.4;

const PARK_BACK = 15;         // where it stops relative to a frontage

const INTRO_DUR = 3.6;

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
    s: venueS(0) - 26,
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
      s.s += e.deltaY * 0.09;
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

    /* ---- the arrival: dropped in over the block, then onto the road --- */
    if (st.intro !== null && mode === "space" && !reduced) {
      if (!st.intro) st.intro = frame.clock.elapsedTime;
      const p = clamp((frame.clock.elapsedTime - st.intro) / INTRO_DUR, 0, 1);
      const e =
        p < 0.68
          ? 0.6 * Math.pow(p / 0.68, 2.1)
          : 0.6 + 0.4 * (1 - Math.pow(1 - (p - 0.68) / 0.32, 2.8));

      roadAt(st.s, 0, _here);
      const high = 78 + 0;
      camera.position.set(
        _here.x * (0.35 + 0.65 * e),
        high + (EYE - high) * e,
        _here.z * (0.35 + 0.65 * e)
      );
      roadAt(st.s + AHEAD, RISE * e, _ahead);
      camera.lookAt(_ahead.x * e, _ahead.y + (1 - e) * 2, _ahead.z * e);

      flight.flying = false;
      if (p >= 1) st.intro = null;
      publish(st);
      return;
    }
    st.intro = null;

    /* ---- how far along the road ---------------------------------------- */
    if (mode === "project" && focusIndex >= 0) {
      /* The write-up drives: how far you have read slides the camera past
         the frontage and lifts it, so the building moves while you read. */
      const p = clamp(progressRef?.current ?? 0, 0, 1);
      const park = venueS(focusIndex) - PARK_BACK + p * 26;
      st.s += shortest(st.s, park) * Math.min(1, dt * 1.8);
      st.tEye = 8 + p * 11;
      st.tLook = 0;
      st.speed = 0;
    } else {
      st.idle += dt;

      if (st.flyTo != null) {
        /* driving itself to a frontage */
        const gap = shortest(st.s, st.flyTo);
        st.s += gap * Math.min(1, dt * 1.6);
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
    st.eye = damp(st.eye, st.tEye, 3.5, dt);
    roadAt(st.s, st.eye, _here);
    camera.position.copy(_here);

    /* down the road, far enough ahead that a corner is rounded rather than
       hit — the look-ahead point goes round it before the camera does */
    roadAt(st.s + AHEAD, RISE, _road);

    /* The road, leaning into the block so the tower is in shot — and all
       the way onto it for the first few seconds, before you pull away. */
    if (st.dragging || st.speed || st.flyTo != null || st.idle > HOLD) {
      st.hq = damp(st.hq, 0, 1.1, dt);
    }
    if (mode === "project") st.hq = 0;
    _base.lerpVectors(_road, _hq, INWARD + (0.92 - INWARD) * st.hq);

    /* and the glance: level with a venue, the head turns right onto it */
    venueAt(st.featured, total, _venue);
    _venue.y = 7;
    const near = Math.abs(shortest(st.s, venueS(st.featured)));
    const g = clamp((GLANCE - near) / (GLANCE - LEVEL), 0, 1);
    const glance = mode === "project" ? 1 : g * g * (3 - 2 * g);
    _want.lerpVectors(_base, _venue, glance);

    /* the head you turned yourself, on top of that */
    st.look = damp(st.look, st.tLook, 3.2, dt);
    if (!st.dragging && !input.turn && mode === "space" && st.idle > RESUME_AFTER) {
      st.tLook = damp(st.tLook, 0, 1.2, dt);
    }
    _dir.subVectors(_want, _here);
    /* No framing offset here on purpose: the hero copy owns the left of the
       screen and the volume rail the right, which leaves the clear band more
       or less centred — so what the camera is looking at is already in it. */
    if (st.look) _dir.applyAxisAngle(UP, st.look);
    st.target.lerp(_dir.add(_here), 1 - Math.pow(0.0015, dt));
    camera.lookAt(st.target);

    flight.flying = mode === "space";
    publish(st);
  });

  return null;
}

const UP = new THREE.Vector3(0, 1, 0);

/* what the craft needs to fly the same road */
function publish(st) {
  flight.s = st.s;
  flight.speed = st.speed;
  flight.eye = st.eye;
}
