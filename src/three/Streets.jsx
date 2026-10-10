import { useMemo } from "react";
import * as THREE from "three";

import { LEG, ROAD, SETBACK } from "./layout";

/* =========================================================
   THE STREET
   ---------------------------------------------------------
   One road round one block, with head office in the middle
   of it: four straight runs and four right-angle corners.

   Drawn as a slab per side with lit kerbs and a dashed
   centre line, plus a slip road off each side into the venue
   built along it, so the buildings read as being on the
   street rather than parked near it. Lamp standards down
   both kerbs give the runs some length to them.
   ========================================================= */

const WIDTH = 13;
const DASHES = 13;
const LAMPS = 7;

export default function Streets({ accent = "#57B41A" }) {
  const sides = useMemo(
    () =>
      [0, 1, 2, 3].map((k) => {
        const mid =
          k === 0 ? [0, ROAD] : k === 1 ? [ROAD, 0] : k === 2 ? [0, -ROAD] : [-ROAD, 0];
        /* sides 0 and 2 run along x, sides 1 and 3 along z */
        const yaw = k === 0 || k === 2 ? Math.PI / 2 : 0;
        const outward =
          k === 0 ? [0, 1] : k === 1 ? [1, 0] : k === 2 ? [0, -1] : [-1, 0];
        /* the venues on the inside of the block are reached back across it */
        const away = k % 2 === 0 ? SETBACK : -SETBACK;
        return { k, mid, yaw, outward, away };
      }),
    []
  );

  return (
    <group>
      {sides.map((s) => (
        <group key={s.k} position={[s.mid[0], 0.06, s.mid[1]]} rotation={[0, s.yaw, 0]}>
          {/* the carriageway, run long so the corners fill in rather than
              leaving a notch where two sides meet */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
            <planeGeometry args={[WIDTH, LEG + WIDTH]} />
            <meshStandardMaterial color="#0e1715" roughness={0.92} metalness={0.08} />
          </mesh>

          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[(side * WIDTH) / 2, 0.02, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              raycast={() => null}
            >
              <planeGeometry args={[0.34, LEG]} />
              <meshBasicMaterial
                color={accent}
                transparent
                opacity={0.45}
                toneMapped={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}

          {Array.from({ length: DASHES }, (_, i) => {
            const z = (i / (DASHES - 1) - 0.5) * (LEG - 6);
            return (
              <mesh
                key={z}
                position={[0, 0.02, z]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => null}
              >
                <planeGeometry args={[0.3, 2.2]} />
                <meshBasicMaterial
                  color={accent}
                  transparent
                  opacity={0.34}
                  toneMapped={false}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}

          {/* lamp standards down both kerbs */}
          {Array.from({ length: LAMPS }, (_, i) => {
            const z = (i / (LAMPS - 1) - 0.5) * (LEG - 10);
            return [-1, 1].map((side) => (
              <group key={z + ":" + side} position={[side * (WIDTH / 2 + 1.2), 0, z]}>
                <mesh raycast={() => null} position={[0, 3.2, 0]}>
                  <cylinderGeometry args={[0.12, 0.16, 6.4, 6]} />
                  <meshStandardMaterial color="#1b2724" metalness={0.7} roughness={0.5} />
                </mesh>
                <mesh raycast={() => null} position={[side * -0.5, 6.5, 0]}>
                  <boxGeometry args={[1.2, 0.18, 0.5]} />
                  <meshStandardMaterial color="#1b2724" metalness={0.7} roughness={0.5} />
                </mesh>
                <mesh raycast={() => null} position={[side * -0.95, 6.32, 0]}>
                  <sphereGeometry args={[0.28, 8, 8]} />
                  <meshBasicMaterial color="#d8ffae" toneMapped={false} />
                </mesh>
              </group>
            ));
          })}
        </group>
      ))}

      {/* the slip road from each kerb across to its frontage */}
      {sides.map((s) => {
        const x = s.mid[0] + s.outward[0] * (s.away / 2);
        const z = s.mid[1] + s.outward[1] * (s.away / 2);
        return (
          <mesh
            key={"slip" + s.k}
            position={[x, 0.05, z]}
            rotation={[-Math.PI / 2, 0, s.yaw]}
            receiveShadow
            raycast={() => null}
          >
            <planeGeometry args={[12, Math.abs(s.away) + 4]} />
            <meshStandardMaterial color="#0e1715" roughness={0.92} metalness={0.08} />
          </mesh>
        );
      })}
    </group>
  );
}
