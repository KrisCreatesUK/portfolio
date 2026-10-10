import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { flight } from "./flight";
import { onStreet } from "./layout";

/* =========================================================
   THE CRAFT
   ---------------------------------------------------------
   A swept organic hull with a lit underside and a ring of
   lamps chasing round the rim — something that has never
   heard of a runway.

   It flies the streets. Earlier versions hung it off the
   camera, which meant it rode whatever curve the camera was
   on and sat in the same corner of the screen forever; now
   it lives in the world and runs the circuit between the
   venues, straight up one street, hard right at the corner,
   straight up the next. Steering adds to its speed, so
   flying the map pushes it along ahead of you, but it keeps
   going on its own when you leave it alone.

   Because it is in the world and not pinned to the camera,
   it is wherever it has got to — not permanently off to one
   side, which is what it did on a phone.
   ========================================================= */

const SIZE = 4.6;             // it is a long way off, so it is built big
const CRUISE = 0.3;           // radians of circuit per second when catching up
const IDLE = 0.07;            // and when it is already ahead of you
const STEER = 0.7;            // how much your own turning pushes it along
const CATCH = 1.7;            // how hard it runs to catch up with your view
const LEAD = 0.08;            // and how far ahead of you it tries to sit
/* Above the streets rather than on them: at street level it spent most of
   its time behind the bar along the bottom of the screen. */
const HOVER = 9;
const CORNER = 0.09;          // how near a corner counts as being in one

const TAU = Math.PI * 2;
const damp = THREE.MathUtils.damp;

const _pos = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _behind = new THREE.Vector3();
const _aim = new THREE.Vector3();

export default function Ship() {
  const group = useRef();
  const body = useRef();
  const ringRef = useRef();
  const under = useRef();
  const lamps = useRef([]);
  const shown = useRef(0);
  /* starts on the street the arrival looks down, so it is there from the
     first frame rather than a lap away */
  const theta = useRef(-0.12);
  const bank = useRef(0);
  const pitch = useRef(0);
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

    shown.current = damp(shown.current, flight.flying ? 1 : 0, 5, dt);
    g.visible = shown.current > 0.02;
    if (!g.visible) return;
    g.scale.setScalar(shown.current * SIZE);

    /* Along the circuit. Three things add up, and all of them are forward:
       its own cruise, whatever your steering pushes into it, and a run to
       catch up when your view has got ahead of it. Nothing subtracts, so it
       never reverses back down a street: once it is in front of you it just
       idles along until you catch it up. */
    let gap = flight.az + LEAD - theta.current;
    gap = ((gap % TAU) + TAU) % TAU;
    const ahead = gap > Math.PI;                   // it is already in front
    const rate =
      (ahead ? IDLE : CRUISE + gap * CATCH) + Math.max(0, flight.vAz * STEER);
    theta.current = (theta.current + rate * dt) % TAU;

    onStreet(theta.current, HOVER + Math.sin(t * 1.1) * 0.22, _pos);
    g.position.copy(_pos);

    /* Face the way the street goes. Sampling a little either side gives the
       direction without any special case for the corners: through one, the
       two samples sit on different sides of it and the heading swings round
       over a few frames, which is exactly how it should look. */
    onStreet(theta.current + 0.05, HOVER, _ahead);
    onStreet(theta.current - 0.05, HOVER, _behind);
    _aim.subVectors(_ahead, _behind);
    const want = Math.atan2(_aim.x, _aim.z);

    let turn = want - yaw.current;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    yaw.current += turn * Math.min(1, dt * 4.5);
    g.rotation.set(0, yaw.current, 0);

    /* How far into a corner it is: zero down a straight, one at the turn. */
    const q = ((theta.current / (Math.PI / 2)) % 1 + 1) % 1;
    const corner = Math.max(0, 1 - Math.min(q, 1 - q) / CORNER);
    const dir = 1;              // it only ever flies one way round

    bank.current = damp(bank.current, corner * 0.75 * dir, 4, dt);
    pitch.current = damp(
      pitch.current,
      THREE.MathUtils.clamp(-flight.vHeight * 0.05, -0.3, 0.3),
      4,
      dt
    );

    if (body.current) {
      body.current.rotation.z = bank.current;
      body.current.rotation.x = pitch.current;
    }

    /* the belly burns harder round a turn; the lamps chase */
    const push = Math.min(1, 0.3 + corner * 0.45 + Math.min(rate, 2) * 0.3);
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

      {/* what it throws on the street below */}
      <pointLight position={[0, -0.3, 0]} color="#93F025" intensity={5} distance={9} />
    </group>
  );
}
