import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { gesture } from "./gesture";
import { flight, input } from "./flight";
import { RING, bearingOf, venueAt } from "./layout";

/* =========================================================
   CAMERA
   ---------------------------------------------------------
   The camera orbits a point, and the trick of the whole map
   is that the point moves. Far out it is head office, so you
   circle the place and see everything at once. Come in — on
   the wheel, or by opening a project — and it slides out to
   the venue you are pointing at, so closing the distance
   actually takes you there rather than pressing your nose
   against the middle of the map.

     drag sideways   fly round
     drag up / down  gain and lose height
     arrows / keys   the same, held
     wheel           in towards what you are facing, or back
     a tap, ‹ ›, dot fly straight to that venue

   Any of those stands the drift down; leave it a few seconds
   and it picks up again from where you left it.

   Inside a write-up the camera belongs to the venue, and how
   far you have read decides where round it you are standing.
   ========================================================= */

const SPACE = { rad: 64, minRad: 25, maxRad: 112 };
const ALT = { min: 2, max: 26, start: 5 };

/* Near-horizontal on purpose. A high angle turns the map into a diagram and
   drops the buildings below the frame; flying low puts them on the skyline. */
const POLAR_MIN = 1.05;
const POLAR_MAX = 1.56;
const POLAR_REST = 1.5;

const ORBIT_SPEED = 0.075;    // the drift round the map when left alone
const RESUME_AFTER = 3.2;

/* How far a drag carries. Generous: a flick should cross the map. */
const DRAG_AZ = 5.6;
const DRAG_ALT = 26;
const ARROW_AZ = 0.85;        // radians per second, while held
const ARROW_ALT = 9;
const FLING_DECAY = 0.055;
const FLING_MIN = 0.0004;

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
const damp = THREE.MathUtils.damp;

/* The camera flies a wider ring than the venues stand on, so one dead on
   your heading would sit exactly in front of head office and black it out.
   Holding a little short of the bearing slides it off to one side with the
   tower behind. A narrow phone screen cannot afford as much of that. */
const AIM_WIDE = 0.26;
const AIM_NARROW = 0.08;
const aimFor = (aspect) =>
  THREE.MathUtils.lerp(AIM_NARROW, AIM_WIDE, clamp((aspect - 0.6) / 0.9, 0, 1));

/* How close you are to the venue you are facing: 0 out on the wide orbit, 1
   standing on its forecourt. Past this much the heading stops reassigning
   which venue is live, or it would swap under you as you arrive. */
/* On a wide screen the hero copy owns the left of the frame and the volume
   rail the right, so the scene is panned a little into the clear band
   between them rather than being left to sit under the rail. */
const SHIFT_WIDE = 10;

const LOCK_AT = 0.3;
const PROJECT_RAD = 26;

const INTRO_DUR = 3.6;
const INTRO_FROM = { alt: 64, pol: 0.26, rad: 20 };

/* the shortest way round from one bearing to another */
function shortest(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

const _venue = new THREE.Vector3();

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
    az: -0.95,
    pol: POLAR_REST,
    rad: SPACE.rad,
    tAz: 0,
    tPol: POLAR_REST,
    tRad: SPACE.rad,
    alt: ALT.start,
    tAlt: ALT.start,
    centre: new THREE.Vector3(),
    tCentre: new THREE.Vector3(),
    look: new THREE.Vector3(0, 7, 0),
    tLook: new THREE.Vector3(0, 7, 0),
    intro: 0,
    idle: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    vAz: 0,
    vAlt: 0,
    pointerId: null,
    aim: AIM_WIDE,
    approach: 0,
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
      gesture.moved = 0;
      s.vAz = 0;
      s.vAlt = 0;
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

      const dAz = -(dx / window.innerWidth) * DRAG_AZ;
      const dAlt = (dy / window.innerHeight) * DRAG_ALT;

      s.tAz += dAz;
      s.tAlt = clamp(s.tAlt + dAlt, ALT.min, ALT.max);

      const now = e.timeStamp || performance.now();
      const ms = Math.max(8, now - s.lastT);
      s.lastT = now;
      s.vAz = (dAz / ms) * 1000;
      s.vAlt = (dAlt / ms) * 1000;
    };

    const up = () => {
      s.dragging = false;
      if (s.pointerId != null) el.releasePointerCapture?.(s.pointerId);
      s.pointerId = null;
      el.classList.remove("is-dragging");
    };

    /* the wheel is the approach: in towards the venue, out to the whole map */
    const wheel = (e) => {
      if (mode !== "space") return;
      e.preventDefault();
      s.idle = 0;
      s.tRad = clamp(s.tRad + e.deltaY * 0.03, SPACE.minRad, SPACE.maxRad);
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

  /* ---- a venue was picked from the bar: fly round to it ---------------- */
  useEffect(() => {
    if (pickIndex == null || mode !== "space") return;
    const s = state.current;
    s.tAz += shortest(s.tAz, bearingOf(pickIndex, total) - s.aim);
    s.idle = 0;
  }, [pickIndex, total, mode]);

  /* ---- entering or leaving a write-up ---------------------------------- */
  useEffect(() => {
    const s = state.current;
    if (mode === "project" && focusIndex >= 0) {
      s.tRad = PROJECT_RAD;
      s.tAlt = 6;
    } else {
      /* back out to the whole map */
      s.tRad = SPACE.rad;
      s.tAlt = ALT.start;
    }
    s.idle = 0;
  }, [mode, focusIndex]);

  useFrame((frame, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    s.aim = aimFor(frame.viewport.aspect);

    if (mode === "project" && focusIndex >= 0) {
      /* The write-up owns the camera: it stands on the venue's forecourt and
         walks round the frontage as you read. */
      const p = clamp(progressRef?.current ?? 0, 0, 1);
      const bearing = bearingOf(focusIndex, total);
      s.tAz += shortest(s.tAz, bearing + 0.55 + p * 1.5) * Math.min(1, dt * 2.2);
      s.tAlt = 6 + p * 9;
      s.tRad = PROJECT_RAD + p * 8;
      s.tPol = clamp(POLAR_REST - p * 0.16, POLAR_MIN, POLAR_MAX);
      s.alt = damp(s.alt, s.tAlt, 3, dt);
      s.approach = damp(s.approach, 1, 2.6, dt);
      venueAt(focusIndex, total, s.tCentre);
      s.tLook.set(s.tCentre.x, 8, s.tCentre.z);
      s.featured = focusIndex;
    } else if (s.intro !== null && !reduced) {
      /* ---- the arrival: a bird's eye of the map, then the floor drops ---
         Timed off the clock, not off accumulated frame deltas: dt is clamped
         so a stutter cannot fling the camera, which means on a slow device
         the deltas stop adding up to real seconds. */
      if (!s.intro) s.intro = frame.clock.elapsedTime;
      const p = clamp((frame.clock.elapsedTime - s.intro) / INTRO_DUR, 0, 1);

      const e =
        p < 0.68
          ? 0.6 * Math.pow(p / 0.68, 2.1)
          : 0.6 + 0.4 * (1 - Math.pow(1 - (p - 0.68) / 0.32, 2.8));

      s.alt = INTRO_FROM.alt + (ALT.start - INTRO_FROM.alt) * e;
      s.tAlt = s.alt;
      s.pol = INTRO_FROM.pol + (POLAR_REST - INTRO_FROM.pol) * e;
      s.tPol = s.pol;
      s.rad = INTRO_FROM.rad + (SPACE.rad - INTRO_FROM.rad) * e;
      s.tRad = SPACE.rad;
      /* Land a little short of the first venue's bearing rather than square
         on it — square on, it stands exactly in front of head office. */
      s.az = -0.95 + e * (0.95 - AIM_WIDE);
      s.tAz = s.az;
      s.centre.setScalar(0);
      s.tCentre.setScalar(0);
      s.approach = 0;
      s.look.set(0, 7 * e, 0);
      s.tLook.copy(s.look);

      camera.position.set(
        Math.sin(s.az) * Math.sin(s.pol) * s.rad,
        Math.cos(s.pol) * s.rad + s.alt,
        Math.cos(s.az) * Math.sin(s.pol) * s.rad
      );
      camera.lookAt(s.look);

      flight.flying = false;
      if (p >= 1) s.intro = null;
      return;
    } else {
      s.idle += dt;

      /* the arrows and the keys, while they are held */
      if (input.turn || input.climb) {
        s.idle = 0;
        s.tAz += input.turn * ARROW_AZ * dt;
        s.tAlt = clamp(s.tAlt + input.climb * ARROW_ALT * dt, ALT.min, ALT.max);
      }

      /* the throw: let go mid-swipe and it keeps going, slowing down */
      if (!s.dragging && (Math.abs(s.vAz) > FLING_MIN || Math.abs(s.vAlt) > FLING_MIN)) {
        s.tAz += s.vAz * dt;
        s.tAlt = clamp(s.tAlt + s.vAlt * dt, ALT.min, ALT.max);
        const keep = Math.pow(FLING_DECAY, dt);
        s.vAz *= keep;
        s.vAlt *= keep;
        s.idle = 0;
      }

      const touring = !s.dragging && !pointing && !reduced && s.idle > RESUME_AFTER;
      if (touring) s.tAz += dt * ORBIT_SPEED;

      s.alt = damp(s.alt, s.tAlt, 4, dt);
      s.tPol = POLAR_REST;

      /* How far in the wheel has brought you, and so how far the thing being
         orbited has slid from head office out to the venue. */
      s.approach = clamp((SPACE.rad - s.tRad) / (SPACE.rad - SPACE.minRad), 0, 1);

      /* Which venue are we pointing at? That one is live — unless we have
         already closed on one, which keeps it live while we arrive. */
      if (onFeature && s.approach < LOCK_AT) {
        let nearest = 0;
        let best = Infinity;
        for (let i = 0; i < total; i++) {
          const d = Math.abs(shortest(s.az + s.aim, bearingOf(i, total)));
          if (d < best) {
            best = d;
            nearest = i;
          }
        }
        if (nearest !== s.featured) {
          s.featured = nearest;
          onFeature(nearest);
        }
      }

      const i = s.featured < 0 ? 0 : s.featured;
      venueAt(i, total, _venue);
      s.tCentre.copy(_venue).multiplyScalar(s.approach);

      /* Aim between head office and the venue you are pointing at, so the
         shot holds both: the venue to one side, the tower behind it. */
      const b = bearingOf(i, total);
      const lean = RING * 0.14 * (1 - s.approach);
      const shift =
        frame.viewport.aspect > 1.25 ? SHIFT_WIDE * (1 - s.approach * 0.7) : 0;
      s.tLook.set(
        s.tCentre.x + Math.sin(b) * lean + Math.cos(s.az) * shift,
        7,
        s.tCentre.z + Math.cos(b) * lean - Math.sin(s.az) * shift
      );
    }

    const par = reduced || s.dragging ? 0 : 1;
    const az = s.tAz + frame.pointer.x * 0.06 * par;
    const pol = clamp(s.tPol - frame.pointer.y * 0.05 * par, POLAR_MIN, POLAR_MAX);

    /* a tall narrow viewport sees less of the map, so stand back a touch */
    const pull = frame.viewport.aspect < 0.85 ? 1.18 : 1;

    const ease = mode === "project" ? 2.6 : 3.4;
    s.az = damp(s.az, az, ease, dt);
    s.pol = damp(s.pol, pol, ease, dt);
    s.rad = damp(s.rad, s.tRad * pull, ease, dt);
    s.centre.lerp(s.tCentre, 1 - Math.pow(0.004, dt));

    const sinPol = Math.sin(s.pol);
    camera.position.set(
      s.centre.x + Math.sin(s.az) * sinPol * s.rad,
      Math.cos(s.pol) * s.rad + s.alt,
      s.centre.z + Math.cos(s.az) * sinPol * s.rad
    );

    s.look.lerp(s.tLook, 1 - Math.pow(0.002, dt));
    camera.lookAt(s.look);

    /* hand the ship the same numbers the camera just used */
    flight.vAz = damp(flight.vAz, (s.az - (flight.lastAz ?? s.az)) / Math.max(dt, 0.008), 6, dt);
    flight.vHeight = damp(
      flight.vHeight,
      (s.alt - (flight.lastAlt ?? s.alt)) / Math.max(dt, 0.008),
      6,
      dt
    );
    flight.az = s.az;
    flight.height = s.alt;
    flight.rad = s.rad;
    flight.lastAz = s.az;
    flight.lastAlt = s.alt;
    flight.flying = s.intro === null;
  });

  return null;
}
