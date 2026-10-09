import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { floorY, towerTop, FLOOR_H } from "./layout";
import { gesture } from "./gesture";

/* =========================================================
   CAMERA
   ---------------------------------------------------------
   The tour. The camera circles the building and rides up and
   down it at the same time, so it keeps arriving at a
   different storey — and whichever storey it is level with
   lights its windows and becomes the one a tap opens. You
   never have to find a target; the building brings each
   project to you.

   But you can fly it yourself, and that is how you choose on
   purpose rather than waiting:

     drag sideways   go round the building
     drag up / down  ride the spiral, storey to storey
     wheel           in and out
     ‹ › or the rail fly straight to that storey

   Any of those stands the tour down. Leave it alone for a
   few seconds and it picks up from exactly where you left
   it, so it never jumps.

   project mode hands the camera to the write-up instead:
   how far you have read decides where it is.
   ========================================================= */

const SPACE = { rad: 13.2, minRad: 7, maxRad: 32 };
const POLAR_MIN = 0.42;
const POLAR_MAX = 1.52;

/* how fast the tour circles, and how fast it rides the building */
const ORBIT_SPEED = 0.17;
const CLIMB_SPEED = 0.28;
const RESUME_AFTER = 3.2;   // seconds of stillness before the tour resumes

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

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
    az: -0.62,
    pol: 1.42,
    rad: SPACE.rad,
    tAz: -0.62,
    tPol: 1.42,
    tRad: SPACE.rad,
    look: new THREE.Vector3(0, floorY(total - 1), 0),
    tLook: new THREE.Vector3(0, floorY(total - 1), 0),
    height: floorY(total - 1),    // the storey the camera is level with
    tHeight: floorY(total - 1),   // and the one it is heading for
    tour: 0,
    idle: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    pointerId: null,
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
      gesture.moved = 0;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.pointerId = e.pointerId;
      el.setPointerCapture?.(e.pointerId);
      el.classList.add("is-dragging");
    };

    const move = (e) => {
      /* any movement counts as "someone is using this" — otherwise the tour
         carries on turning the building while you are lining up a tap */
      s.idle = 0;
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      gesture.moved += Math.hypot(dx, dy);

      /* Sideways goes round the building, up and down rides it. Between
         them you are flying the spiral, which is the only way to line up a
         particular storey on purpose. */
      s.tAz -= (dx / window.innerWidth) * 3.4;
      s.tHeight = clamp(
        s.tHeight + (dy / window.innerHeight) * FLOOR_H * 4,
        floorY(0) - 0.5,
        towerTop(total) - 0.6
      );
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
      s.tRad = clamp(s.tRad + e.deltaY * 0.012, SPACE.minRad, SPACE.maxRad);
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
  }, [gl, mode, total]);

  /* ---- a storey was picked: fly to it and hold ------------------------- */
  useEffect(() => {
    if (pickIndex == null || mode !== "space") return;
    const s = state.current;
    s.tHeight = floorY(total - 1 - pickIndex);
    s.idle = 0;   // the tour stands down while you are choosing
  }, [pickIndex, total, mode]);

  /* ---- entering or leaving a project ---------------------------------- */
  useEffect(() => {
    const s = state.current;
    if (mode === "project" && focusIndex >= 0) {
      s.tAz = -0.95;
      s.tPol = 1.28;
      s.tRad = 9.6;
    } else {
      s.tRad = SPACE.rad;
    }
    s.idle = 0;
  }, [mode, focusIndex]);

  useFrame((frame, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.05);

    const bottom = floorY(0);
    const top = floorY(total - 1);

    if (mode === "project" && focusIndex >= 0) {
      const p = clamp(progressRef?.current ?? 0, 0, 1);
      s.tAz = -0.95 + p * 2.3;
      s.tPol = clamp(1.28 - p * 0.4, POLAR_MIN, POLAR_MAX);
      s.tRad = 9.6 + p * 4.4;
      s.tHeight = floorY(total - 1 - focusIndex);
      s.height = damp(s.height, s.tHeight, 3, dt);
      s.tLook.set(0, s.height, 0);
    } else {
      s.idle += dt;

      /* the tour only runs when nobody is touching anything */
      const touring = !s.dragging && !pointing && !reduced && s.idle > RESUME_AFTER;

      if (touring) {
        s.tour += dt;
        s.tAz += dt * ORBIT_SPEED;
        /* ride up and down on a slower cycle than the orbit, so every pass
           round the building arrives at a different storey */
        const ride = (Math.sin(s.tour * CLIMB_SPEED) + 1) / 2;
        s.tHeight = bottom + ride * (top - bottom);
        /* almost level with the glazing — a drone looking in, not a map of
           the roof. A high angle turns the building into a box. */
        s.tPol = 1.44 - Math.sin(s.tour * CLIMB_SPEED * 0.7) * 0.1;
      }

      /* the climb is always damped, so a pick is a flight and not a cut */
      s.height = damp(s.height, s.tHeight, 3.2, dt);

      /* Aim a little under the storey we are level with. That lifts it into
         the upper half of the frame and lets the rest of the building fill
         the middle, instead of one lit band with dead sky over it. */
      s.tLook.set(0, s.height - 1.15, 0);
    }

    /* which storey is the camera level with? that one lights up */
    if (onFeature) {
      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < total; i++) {
        const d = Math.abs(floorY(total - 1 - i) - s.height);
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

    /* parallax: a light hand on top of wherever the camera is going */
    const par = reduced || s.dragging ? 0 : 1;
    const az = s.tAz + frame.pointer.x * 0.09 * par;
    const pol = clamp(s.tPol - frame.pointer.y * 0.06 * par, POLAR_MIN, POLAR_MAX);

    /* a tall narrow viewport sees less of the facade, so stand back a touch */
    const pull = frame.viewport.aspect < 0.85 ? 1.22 : 1;

    const ease = mode === "project" ? 2.6 : 1.7;
    s.az = damp(s.az, az, ease, dt);
    s.pol = damp(s.pol, pol, ease, dt);
    s.rad = damp(s.rad, s.tRad * pull, ease, dt);

    const sinPol = Math.sin(s.pol);
    camera.position.set(
      Math.sin(s.az) * sinPol * s.rad,
      Math.cos(s.pol) * s.rad + s.height,
      Math.cos(s.az) * sinPol * s.rad
    );

    s.look.lerp(s.tLook, 1 - Math.pow(0.002, dt));
    camera.lookAt(s.look);
  });

  return null;
}
