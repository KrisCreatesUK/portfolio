import { useMemo } from "react";
import * as THREE from "three";

import { STREET } from "./layout";

/* =========================================================
   THE STREETS
   ---------------------------------------------------------
   Four runs of road between the four venues, laid out as a
   diamond so every junction is a right angle. The craft
   flies these, and without them drawn it would look like it
   was turning corners in mid-air for no reason.

   Each run is one flat slab with a lit kerb down either
   side, and a dashed centre line so you can see movement
   along it from a long way off.
   ========================================================= */

const WIDTH = 10;
const DASHES = 9;

export default function Streets({ accent = "#57B41A" }) {
  /* the four corners of the diamond, which are the four forecourts */
  const runs = useMemo(() => {
    const corner = (k) => {
      const a = (k / 4) * Math.PI * 2;
      return new THREE.Vector3(Math.sin(a) * STREET, 0, Math.cos(a) * STREET);
    };
    return [0, 1, 2, 3].map((k) => {
      const from = corner(k);
      const to = corner(k + 1);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const d = to.clone().sub(from);
      return { key: k, mid: [mid.x, 0.06, mid.z], yaw: Math.atan2(d.x, d.z), length: d.length() };
    });
  }, []);

  return (
    <group>
      {runs.map((r) => (
        <group key={r.key} position={r.mid} rotation={[0, r.yaw, 0]}>
          {/* the road */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
            <planeGeometry args={[WIDTH, r.length]} />
            <meshStandardMaterial color="#0d1412" roughness={0.9} metalness={0.1} />
          </mesh>

          {/* kerbs */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[(s * WIDTH) / 2, 0.02, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              raycast={() => null}
            >
              <planeGeometry args={[0.3, r.length]} />
              <meshBasicMaterial
                color={accent}
                transparent
                opacity={0.42}
                toneMapped={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}

          {/* the centre line, dashed */}
          {Array.from({ length: DASHES }, (_, i) => {
            const z = (i / (DASHES - 1) - 0.5) * (r.length - 3);
            return (
              <mesh
                key={z}
                position={[0, 0.02, z]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => null}
              >
                <planeGeometry args={[0.26, 1.5]} />
                <meshBasicMaterial
                  color={accent}
                  transparent
                  opacity={0.3}
                  toneMapped={false}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
