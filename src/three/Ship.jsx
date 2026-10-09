import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { flight } from "./flight";

/* =========================================================
   THE SHIP
   ---------------------------------------------------------
   A small craft flying the same orbit as the camera, a
   little ahead of it and below the eyeline, so the whole
   thing reads as third person: you are flying this around
   the building rather than scrubbing a camera.

   It takes its position straight from the rig's published
   state, so there is only ever one thing being flown — the
   ship is a passenger of the camera, not a second system
   that could drift out of step with it.

   It banks into turns and pitches into climbs, which is what
   actually sells the movement; the hull itself is six boxes.
   ========================================================= */

/* Where it sits in the shot. Placed relative to the camera rather than in
   world space: the camera's eye rides above the orbit and tilts down, so a
   ship pinned to world coordinates falls straight out of the bottom of the
   frame. Hung off the camera it is always exactly where you want it. */
const SIZE = 0.46;      // little, as asked — it is a companion, not the view
const AHEAD = 5.2;      // metres in front of the lens
const BELOW = 0.38;     // and a little under the eyeline
const ASIDE = 1.05;     // out to the right

/* Those two numbers are not free: lower and more central and the ship flies
   along behind the "now showing" bar, which is exactly where it ended up the
   first time. This parks it in the one quarter of the screen the HUD leaves
   empty on both desktop and phone. */

const damp = THREE.MathUtils.damp;

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _pos = new THREE.Vector3();

export default function Ship() {
  const group = useRef();
  const body = useRef();
  const glowA = useRef();
  const glowB = useRef();
  const bank = useRef(0);
  const pitch = useRef(0);
  const shown = useRef(0);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    /* fade out during the arrival and inside a write-up */
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
      .addScaledVector(_up, -BELOW + Math.sin(t * 1.5) * 0.05)
      .addScaledVector(_right, ASIDE);

    /* Pinned, not chased. It hangs off the camera, so any lag here reads as
       the ship sliding about the screen rather than flying. */
    g.position.copy(_pos);

    /* face along the orbit — the tangent, not the building */
    const az = flight.az;
    const ahead = g.position
      .clone()
      .add(new THREE.Vector3(Math.cos(az), flight.vHeight * 0.16, -Math.sin(az)));
    g.lookAt(ahead);

    /* bank into the turn, pitch into the climb */
    bank.current = damp(bank.current, THREE.MathUtils.clamp(flight.vAz * 1.6, -0.85, 0.85), 4, dt);
    pitch.current = damp(pitch.current, THREE.MathUtils.clamp(-flight.vHeight * 0.1, -0.4, 0.4), 4, dt);

    if (body.current) {
      body.current.rotation.z = bank.current;
      body.current.rotation.x = pitch.current;
    }

    /* the engines burn harder the faster it is going */
    const push = Math.min(1, Math.abs(flight.vAz) * 2.2 + Math.abs(flight.vHeight) * 0.18);
    const burn = 0.42 + push * 0.45 + Math.sin(t * 18) * 0.04;
    [glowA, glowB].forEach((r) => {
      if (r.current) {
        r.current.material.opacity = burn;
        r.current.scale.set(1, 1, 0.7 + push * 1.3);
      }
    });
  });

  return (
    <group ref={group} raycast={() => null}>
      <group ref={body}>
        {/* fuselage */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.13, 0.62, 6]} />
          <meshStandardMaterial color="#1b2a27" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* canopy */}
        <mesh position={[0, 0.06, 0.06]}>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial
            color="#8ef02a"
            emissive="#93F025"
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>

        {/* wings, swept back */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.2, -0.01, -0.1]} rotation={[0, 0, s * 0.22]}>
            <boxGeometry args={[0.34, 0.022, 0.2]} />
            <meshStandardMaterial color="#16211f" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}

        {/* wingtip lights */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.36, -0.01, -0.13]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color={s < 0 ? "#ff4d6d" : "#49e0ff"} toneMapped={false} />
          </mesh>
        ))}

        {/* engines */}
        {[-1, 1].map((s, i) => (
          <group key={s} position={[s * 0.12, 0, -0.3]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.052, 0.052, 0.16, 10]} />
              <meshStandardMaterial color="#121c1a" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh ref={i === 0 ? glowA : glowB} position={[0, 0, -0.14]}>
              <coneGeometry args={[0.046, 0.3, 10, 1, true]} />
              <meshBasicMaterial
                color="#93F025"
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* it throws a little light of its own */}
      <pointLight position={[0, 0, -0.3]} color="#93F025" intensity={2.4} distance={4} />
    </group>
  );
}
