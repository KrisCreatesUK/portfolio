import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { flight } from "./flight";
import { CRAFT_AHEAD, CRAFT_HOVER, cornerAt, roadAt } from "./layout";

/* =========================================================
   THE CRAFT
   ---------------------------------------------------------
   A swept organic hull with a lit underside and a ring of
   lamps chasing round the rim — something that has never
   heard of a runway.

   It flies the street, a fixed distance up the road ahead of
   the camera, so you are always following it: it goes round
   each corner before you do, banking into the turn, and you
   watch it do it. That is the whole reason it exists.

   Everything it needs is the camera's own distance along the
   road, which is one number, so the two can never disagree
   about where the road went.
   ========================================================= */

const SIZE = 4.2;
const AHEAD = CRAFT_AHEAD;    // how far up the road it flies
const HOVER = CRAFT_HOVER;    // and how high above it
const BANK = 0.85;

const damp = THREE.MathUtils.damp;

const _pos = new THREE.Vector3();
const _next = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _aim = new THREE.Vector3();

export default function Ship() {
  const group = useRef();
  const body = useRef();
  const ringRef = useRef();
  const under = useRef();
  const lamps = useRef([]);
  const shown = useRef(0);
  const bank = useRef(0);
  const yaw = useRef(0);

  const lampAngles = useMemo(
    () => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2),
    []
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    /* During the arrival the rig is flying it, because the camera is chasing
       it and the two cannot be allowed to disagree about where it is. */
    const arriving = flight.intro !== null;
    shown.current = damp(shown.current, flight.flying || arriving ? 1 : 0, 5, dt);
    g.visible = shown.current > 0.02;
    if (!g.visible) return;
    g.scale.setScalar(shown.current * SIZE);

    if (arriving) {
      g.position.set(flight.sx, flight.sy, flight.sz);
      g.rotation.set(0, flight.syaw, 0);
      yaw.current = flight.syaw;
      bank.current = flight.sbank;
      if (body.current) body.current.rotation.z = flight.sbank;
      if (ringRef.current) ringRef.current.rotation.y = t * 3.4;
      if (under.current) under.current.material.opacity = 0.75;
      lamps.current.forEach((m, i) => {
        if (!m) return;
        const phase = (t * 2.4 + i / lampAngles.length) % 1;
        m.opacity = 0.25 + Math.pow(1 - phase, 3) * 0.75;
      });
      return;
    }

    const s = flight.s + AHEAD;
    roadAt(s, HOVER + Math.sin(t * 1.1) * 0.3, _pos);
    g.position.copy(_pos);

    /* Face the way the road goes. Sampling either side gives the direction
       with no special case for the corners: through one, the two samples sit
       on different sides of it and the nose swings round over a few frames,
       which is exactly how it should look. */
    roadAt(s + 2.5, 0, _next);
    roadAt(s - 2.5, 0, _prev);
    _aim.subVectors(_next, _prev);
    const want = Math.atan2(_aim.x, _aim.z);

    let turn = want - yaw.current;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    yaw.current += turn * Math.min(1, dt * 5);
    g.rotation.set(0, yaw.current, 0);

    /* lean into the bend, and burn harder through it */
    const corner = cornerAt(s, 13);
    bank.current = damp(bank.current, corner * BANK, 4, dt);
    if (body.current) body.current.rotation.z = bank.current;

    const push = Math.min(1, 0.3 + corner * 0.45 + Math.abs(flight.speed) * 0.02);
    if (under.current) under.current.material.opacity = 0.3 + push * 0.5;
    if (ringRef.current) ringRef.current.rotation.y = t * (0.7 + push * 3);
    lamps.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 1.8 + i / lampAngles.length) % 1;
      m.opacity = 0.25 + Math.pow(1 - phase, 3) * 0.75;
    });
  });

  return (
    <group ref={group} raycast={() => null}>
      <group ref={body}>
        {/* upper shell */}
        <mesh scale={[1, 0.34, 1.25]}>
          <sphereGeometry args={[0.33, 20, 14]} />
          <meshStandardMaterial color="#16302a" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* lower shell, a little wider and darker */}
        <mesh scale={[1.06, 0.2, 1.12]} position={[0, -0.04, 0]}>
          <sphereGeometry args={[0.33, 20, 12]} />
          <meshStandardMaterial color="#0a1714" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* the bulb on top — a cockpit with nothing human in it */}
        <mesh position={[0, 0.085, 0.03]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial
            color="#b6ff5e"
            emissive="#93F025"
            emissiveIntensity={1.3}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>

        {/* the belly light */}
        <mesh ref={under} position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 24]} />
          <meshBasicMaterial
            color="#93F025"
            transparent
            opacity={0.4}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* a ring of lamps chasing round the rim */}
        <group ref={ringRef}>
          {lampAngles.map((a, i) => (
            <mesh key={a} position={[Math.cos(a) * 0.335, -0.015, Math.sin(a) * 0.4]}>
              <sphereGeometry args={[0.027, 8, 8]} />
              <meshBasicMaterial
                ref={(m) => (lamps.current[i] = m)}
                color="#c8ff8a"
                transparent
                opacity={0.6}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        {/* two swept tines, so it has a front */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.26, -0.01, 0.28]} rotation={[0.2, s * -0.3, 0]}>
            <coneGeometry args={[0.045, 0.34, 6]} />
            <meshStandardMaterial color="#13231f" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* what it throws on the road below */}
      <pointLight position={[0, -0.3, 0]} color="#93F025" intensity={6} distance={11} />
    </group>
  );
}
