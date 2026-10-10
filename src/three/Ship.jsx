import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { flight } from "./flight";

/* =========================================================
   THE CRAFT
   ---------------------------------------------------------
   Not a jet. A swept organic hull with a lit underside and a
   ring of lamps chasing round the rim — closer to something
   that has never heard of a runway.

   It flies the same orbit as the camera, a little ahead and
   out to one side, and it turns to face the way it is
   actually going. That last part matters: the first version
   always pointed one way round the map, so flying the other
   way it flew backwards.

   It hangs off the camera rather than sitting in the world.
   The eye rides above the orbit and tilts down, so a craft
   pinned to world coordinates drops straight out of frame —
   and it sits out to the right because dead centre and low
   is exactly where the "now showing" bar lives.
   ========================================================= */

const SIZE = 0.52;
const AHEAD = 5.4;
const BELOW = 0.42;
const ASIDE = 1.05;

const damp = THREE.MathUtils.damp;

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _dir = new THREE.Vector3();

export default function Ship() {
  const group = useRef();
  const body = useRef();
  const ringRef = useRef();
  const under = useRef();
  const lamps = useRef([]);
  const shown = useRef(0);
  const bank = useRef(0);
  const pitch = useRef(0);
  const heading = useRef(1);   // +1 or -1: which way round it is flying

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

    const cam = state.camera;
    cam.getWorldDirection(_fwd);
    _right.crossVectors(_fwd, cam.up).normalize();
    _up.crossVectors(_right, _fwd).normalize();

    _pos
      .copy(cam.position)
      .addScaledVector(_fwd, AHEAD)
      .addScaledVector(_up, -BELOW + Math.sin(t * 1.4) * 0.06)
      .addScaledVector(_right, ASIDE);

    g.position.copy(_pos);

    /* Face the way it is going. The sign of the turn rate says which way
       round the ring that is; hold the last direction while drifting, so it
       never spins on the spot at a standstill. */
    if (Math.abs(flight.vAz) > 0.02) heading.current = Math.sign(flight.vAz);
    const dir = heading.current;
    const az = flight.az;

    _dir.set(
      Math.cos(az) * dir,
      THREE.MathUtils.clamp(flight.vHeight * 0.12, -0.6, 0.6),
      -Math.sin(az) * dir
    );
    _aim.copy(g.position).add(_dir);
    g.lookAt(_aim);

    /* bank into the turn, nose into the climb */
    bank.current = damp(
      bank.current,
      THREE.MathUtils.clamp(flight.vAz * dir * -2.2, -0.9, 0.9),
      4,
      dt
    );
    pitch.current = damp(
      pitch.current,
      THREE.MathUtils.clamp(-flight.vHeight * 0.08, -0.35, 0.35),
      4,
      dt
    );

    if (body.current) {
      body.current.rotation.z = bank.current;
      body.current.rotation.x = pitch.current;
    }

    /* the belly burns harder the faster it goes; the lamps chase round */
    const push = Math.min(1, Math.abs(flight.vAz) * 2.4 + Math.abs(flight.vHeight) * 0.14);
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

      <pointLight position={[0, -0.2, 0]} color="#93F025" intensity={3} distance={5} />
    </group>
  );
}
