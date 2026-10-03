import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { driveY } from "./layout";

/* =========================================================
   CAMERA
   ---------------------------------------------------------
   One rig, two jobs.

   space    — you fly it. Drag to swing around the array,
              wheel to pull in and out. Let go and it drifts
              on its own again after a couple of seconds, so
              the page is never still but never fights you
              either.

   project  — it takes over: flies in on the drive you opened
              and then keeps moving as you read, driven by
              how far down the write-up you are.

   Everything is a target plus damping, so a mode change is a
   flight rather than a cut. All of the state lives in a ref
   and is only ever touched from an event handler or the
   frame loop — never during render.
   ========================================================= */

const ORIGIN = new THREE.Vector3(0, 2.6, 0);

const SPACE = { rad: 11.4, pol: 1.2, minRad: 6.2, maxRad: 26 };
const POLAR_MIN = 0.42; // don't fly under the floor
const POLAR_MAX = 1.52;

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

export default function CameraRig({ mode, focusIndex, total, progressRef, reduced = false }) {
  const { camera, gl } = useThree();

  const state = useRef({
    az: -0.62,
    pol: SPACE.pol,
    rad: SPACE.rad,
    tAz: -0.62,
    tPol: SPACE.pol,
    tRad: SPACE.rad,
    look: ORIGIN.clone(),
    tLook: ORIGIN.clone(),
    idle: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    pointerId: null,
  });

  /* ---- drag to fly, wheel to approach ------------------------------- */
  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;

    const down = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      s.dragging = true;
      s.idle = 0;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.pointerId = e.pointerId;
      el.setPointerCapture?.(e.pointerId);
      el.classList.add("is-dragging");
    };

    const move = (e) => {
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.idle = 0;
      /* scale by viewport so a drag feels the same on any screen */
      s.tAz -= (dx / window.innerWidth) * 3.4;
      s.tPol = clamp(s.tPol - (dy / window.innerHeight) * 2.2, POLAR_MIN, POLAR_MAX);
    };

    const up = () => {
      s.dragging = false;
      if (s.pointerId != null) el.releasePointerCapture?.(s.pointerId);
      s.pointerId = null;
      el.classList.remove("is-dragging");
    };

    /* With a write-up open the wheel belongs to the page, not the camera. */
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
  }, [gl, mode]);

  /* ---- entering or leaving a project: pick the approach ---------------- */
  useEffect(() => {
    const s = state.current;
    if (mode === "project" && focusIndex >= 0) {
      /* come round to the front-left of the bay, close and low */
      s.tAz = -0.95;
      s.tPol = 1.3;
      s.tRad = 9.2;
    } else {
      s.tRad = SPACE.rad;
      s.tPol = SPACE.pol;
    }
    s.idle = 0;
  }, [mode, focusIndex]);

  useFrame((frame, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    const t = frame.clock.elapsedTime;

    if (mode === "project" && focusIndex >= 0) {
      /* reading is the input: the further down the write-up, the further
         the camera has swung round and risen over the array */
      const p = clamp(progressRef?.current ?? 0, 0, 1);
      s.tAz = -0.95 + p * 2.3;
      s.tPol = clamp(1.3 - p * 0.42, POLAR_MIN, POLAR_MAX);
      s.tRad = 9.2 + p * 4.6;
      s.tLook.set(0, driveY(total - 1 - focusIndex) + 0.3, 0);
    } else {
      /* idle drift — only once the pointer has been still a moment */
      s.idle += dt;
      if (!s.dragging && s.idle > 2 && !reduced) {
        s.tAz += dt * 0.045;
        s.tPol += Math.sin(t * 0.09) * dt * 0.02;
      }
      s.tLook.copy(ORIGIN);
    }

    /* parallax: a light hand on top of wherever the camera is going */
    const par = reduced || s.dragging ? 0 : 1;
    const az = s.tAz + frame.pointer.x * 0.1 * par;
    const pol = clamp(s.tPol - frame.pointer.y * 0.07 * par, POLAR_MIN, POLAR_MAX);

    /* a tall narrow viewport crops the array, so stand further back */
    const pull = frame.viewport.aspect < 0.85 ? 1.5 : 1;

    const ease = mode === "project" ? 2.6 : 1.9;
    s.az = damp(s.az, az, ease, dt);
    s.pol = damp(s.pol, pol, ease, dt);
    s.rad = damp(s.rad, s.tRad * pull, ease, dt);

    const sinPol = Math.sin(s.pol);
    camera.position.set(
      Math.sin(s.az) * sinPol * s.rad,
      Math.cos(s.pol) * s.rad + 2.4,
      Math.cos(s.az) * sinPol * s.rad
    );

    s.look.lerp(s.tLook, 1 - Math.pow(0.0015, dt));
    camera.lookAt(s.look);
  });

  return null;
}
