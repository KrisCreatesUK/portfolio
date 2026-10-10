import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { gesture } from "./gesture";
import { flight, input } from "./flight";
import { RING, bearingOf } from "./layout";

/* =========================================================
   CAMERA
   ---------------------------------------------------------
   The map is a ring of monuments around the head office, and
   the camera flies that ring. Heading is what matters:
   whichever monument you are pointing at is the one lit,
   named in the bar, and opened by a tap. Flying and choosing
   are the same gesture.

     drag sideways   fly round the ring
     drag up / down  gain and lose height
     arrows / keys   the same, held
     wheel           in and out
     ‹ › or a dot    fly straight to that monument

   Any of those stands the drift down. Leave it a few seconds
   and it picks up from where you left it.

   project mode hands the camera to the write-up: how far you
   have read decides where it is.
   ========================================================= */

/* Far enough out that the monument you are pointing at — nineteen units in
   on the same bearing — sits whole in the frame with head office behind it.
   Closer than this and it overflows the screen. */
const SPACE = { rad: 44, minRad: 24, maxRad: 82 };
const ALT = { min: 2, max: 22, start: 4 };

/* Near-horizontal on purpose. A high angle turns the map into a diagram and
   drops the monuments below the frame; flying low puts them on the skyline
   with head office behind, which is the whole point of the place. */
const POLAR_MIN = 1.05;
const POLAR_MAX = 1.56;
const POLAR_REST = 1.5;

const ORBIT_SPEED = 0.085;    // the drift round the ring when left alone
const RESUME_AFTER = 3.2;

/* How far a drag carries. Generous: a flick should cross the map. */
const DRAG_AZ = 5.6;
const DRAG_ALT = 26;
const ARROW_AZ = 0.85;        // radians per second, while held
const ARROW_ALT = 9;
const FLING_DECAY = 0.055;
const FLING_MIN = 0.0004;

/* The camera flies a wider ring than the monuments stand on, so a monument
   dead on your heading would sit exactly in front of head office and black it
   out. Holding the heading a little short of the bearing slides the monument
   off to one side with the building behind it — which is the shot. A narrow
   phone screen can't afford as much of that offset, so it scales with aspect. */
const AIM_WIDE = 0.4;
const AIM_NARROW = 0.1;
const aimFor = (aspect) => THREE.MathUtils.lerp(AIM_NARROW, AIM_WIDE, clamp((aspect - 0.6) / 0.9, 0, 1));

const INTRO_DUR = 3.6;
const INTRO_FROM = { alt: 58, pol: 0.26, rad: 16 };

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

/* the shortest way round from one bearing to another */
function shortest(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

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
    az: -0.55,
    pol: POLAR_REST,
    rad: SPACE.rad,
    tAz: 0,
    tPol: POLAR_REST,
    tRad: SPACE.rad,
    alt: ALT.start,
    tAlt: ALT.start,
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

    const wheel = (e) => {
      if (mode !== "space") return;
      e.preventDefault();
      s.idle = 0;
      s.tRad = clamp(s.tRad + e.deltaY * 0.016, SPACE.minRad, SPACE.maxRad);
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

  /* ---- a monument was picked: fly round to it ------------------------- */
  useEffect(() => {
    if (pickIndex == null || mode !== "space") return;
    const s = state.current;
    s.tAz += shortest(s.tAz, bearingOf(pickIndex, total) - s.aim);
    s.idle = 0;
  }, [pickIndex, total, mode]);

  /* ---- entering or leaving a project ---------------------------------- */
  useEffect(() => {
    const s = state.current;
    if (mode === "project" && focusIndex >= 0) {
      s.tRad = 13;
      s.tAlt = 7;
    } else {
      s.tRad = SPACE.rad;
    }
    s.idle = 0;
  }, [mode, focusIndex]);

  useFrame((frame, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    s.aim = aimFor(frame.viewport.aspect);

    if (mode === "project" && focusIndex >= 0) {
      /* stand off the monument being read about, swinging round as you go */
      const p = clamp(progressRef?.current ?? 0, 0, 1);
      const bearing = bearingOf(focusIndex, total);
      s.tAz += shortest(s.tAz, bearing + 0.5 + p * 1.6) * Math.min(1, dt * 2.2);
      s.tAlt = 7 + p * 7;
      s.tRad = 13 + p * 7;
      s.tPol = clamp(POLAR_REST - p * 0.2, POLAR_MIN, POLAR_MAX);
      s.alt = damp(s.alt, s.tAlt, 3, dt);
      s.tLook.set(Math.sin(bearing) * RING * 0.5, 5.5, Math.cos(bearing) * RING * 0.5);
    } else if (s.intro !== null && !reduced) {
      /* ---- the arrival: a bird's eye of the map, then the floor drops ---
         Timed off the clock, not off accumulated frame deltas: dt is clamped
         so a stutter can't fling the camera, which means on a slow device
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
      /* land facing the first monument, not between two of them */
      s.az = -0.55 + e * 0.55;
      s.tAz = s.az;
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

      /* Aim between head office and the monument you are pointing at, so the
         shot holds both: the monument to one side, the tower behind it. */
      const b = bearingOf(s.featured < 0 ? 0 : s.featured, total);
      s.tLook.set(Math.sin(b) * RING * 0.3, 7, Math.cos(b) * RING * 0.3);
    }

    /* which monument are we pointing at? that one is live */
    if (onFeature && s.intro === null) {
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

    const par = reduced || s.dragging ? 0 : 1;
    const az = s.tAz + frame.pointer.x * 0.06 * par;
    const pol = clamp(s.tPol - frame.pointer.y * 0.05 * par, POLAR_MIN, POLAR_MAX);

    /* a tall narrow viewport sees less of the map, so stand back a touch */
    const pull = frame.viewport.aspect < 0.85 ? 1.2 : 1;

    const ease = mode === "project" ? 2.6 : 3.4;
    s.az = damp(s.az, az, ease, dt);
    s.pol = damp(s.pol, pol, ease, dt);
    s.rad = damp(s.rad, s.tRad * pull, ease, dt);

    const sinPol = Math.sin(s.pol);
    camera.position.set(
      Math.sin(s.az) * sinPol * s.rad,
      Math.cos(s.pol) * s.rad + s.alt,
      Math.cos(s.az) * sinPol * s.rad
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
    flight.flying = mode === "space" && s.intro === null;
  });

  return null;
}
