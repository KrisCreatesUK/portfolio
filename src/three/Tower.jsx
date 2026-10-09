import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { labelTexture, cover } from "./textures";
import { FLOOR_H, TOWER_W, TOWER_D, floorY, towerTop } from "./layout";

/* =========================================================
   THE TOWER
   ---------------------------------------------------------
   One storey per project, and the project lives in the
   windows. Each floor is glazed on all four faces with the
   same screen, so whichever way the camera has flown round
   the building there is always a lit window looking back.

   This replaced a rack of drives whose faces were small,
   flat and almost impossible to hit. A whole storey is a
   target you cannot miss, on a phone or anywhere else.
   ========================================================= */

const shell = { color: "#0c1513", roughness: 0.42, metalness: 0.7 };
const dark = { color: "#070d0c", roughness: 0.55, metalness: 0.5 };

/* glazing sits just proud of the slab on each face */
const FACES = [
  { pos: [0, 0, TOWER_D / 2 + 0.02], rot: [0, 0, 0], w: TOWER_W - 0.5 },
  { pos: [0, 0, -TOWER_D / 2 - 0.02], rot: [0, Math.PI, 0], w: TOWER_W - 0.5 },
  { pos: [TOWER_W / 2 + 0.02, 0, 0], rot: [0, Math.PI / 2, 0], w: TOWER_D - 0.5 },
  { pos: [-TOWER_W / 2 - 0.02, 0, 0], rot: [0, -Math.PI / 2, 0], w: TOWER_D - 0.5 },
];

const WIN_H = FLOOR_H - 1.05;

function Floor({ project, index, y, featured, onSelect, onHover }) {
  const group = useRef();
  const lights = useRef([]);
  const glow = useRef();

  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);
  const tex = useTexture(project.shot);

  /* one cropped copy of the screen per face, built once — a hook can't live
     inside the map that draws them */
  const faceMaps = useMemo(
    () =>
      FACES.map((f) => {
        const t = tex.clone();
        t.colorSpace = THREE.SRGBColorSpace;
        return cover(t, f.w / WIN_H);
      }),
    [tex]
  );

  const signTex = useMemo(
    () =>
      labelTexture(
        [
          { text: project.code, size: 30, color: project.accent, spacing: 9, font: "monospace" },
          { text: project.name.toUpperCase(), size: 38, color: "#dbe8dc", spacing: 3, font: "sans-serif" },
        ],
        { width: 1024, height: 170 }
      ),
    [project]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    /* the storey you are passing lights right up; the rest idle dim */
    const want = featured ? 1 : 0.42;
    lights.current.forEach((m, i) => {
      if (!m) return;
      const flicker = featured ? 1 : 0.92 + Math.sin(t * 1.3 + index * 2 + i) * 0.08;
      m.opacity = THREE.MathUtils.damp(m.opacity, want * flicker, 4, dt);
    });

    if (glow.current) {
      glow.current.material.opacity = THREE.MathUtils.damp(
        glow.current.material.opacity,
        featured ? 0.5 : 0.08,
        4,
        dt
      );
    }

    if (group.current) {
      /* the featured storey eases out of the facade a touch, so the building
         visibly opens up as the camera comes round to it */
      const out = featured ? 0.16 : 0;
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, 1 + out * 0.05, 5, dt));
    }
  });

  return (
    <group
      ref={group}
      position={[0, y, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(project.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      {/* the storey itself — the whole thing is the target */}
      <RoundedBox args={[TOWER_W, FLOOR_H - 0.08, TOWER_D]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial {...shell} />
      </RoundedBox>

      {/* floor slabs top and bottom, so the storeys read separately */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, (s * (FLOOR_H - 0.08)) / 2, 0]}>
          <boxGeometry args={[TOWER_W + 0.22, 0.12, TOWER_D + 0.22]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}

      {/* glazing on all four faces */}
      {FACES.map((f, i) => (
        <group key={i} position={f.pos} rotation={f.rot}>
          <mesh>
            <planeGeometry args={[f.w, WIN_H]} />
            <meshBasicMaterial
              map={faceMaps[i]}
              toneMapped={false}
              transparent
              opacity={0.42}
              ref={(m) => (lights.current[i] = m)}
            />
          </mesh>

          {/* window frame */}
          <lineSegments position={[0, 0, 0.004]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(f.w, WIN_H)]} />
            <lineBasicMaterial color={accent} transparent opacity={featured ? 0.95 : 0.5} />
          </lineSegments>

          {/* mullions, to make it glazing rather than a screen */}
          {[-0.25, 0.25].map((o) => (
            <mesh key={o} position={[f.w * o, 0, 0.006]}>
              <planeGeometry args={[0.025, WIN_H]} />
              <meshBasicMaterial color="#060c0b" transparent opacity={0.8} />
            </mesh>
          ))}

          {/* sill light */}
          <mesh position={[0, -WIN_H / 2 - 0.1, 0.006]}>
            <planeGeometry args={[f.w, 0.035]} />
            <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={featured ? 1 : 0.6} />
          </mesh>
        </group>
      ))}

      {/* the storey's name, on the front */}
      <mesh position={[0, -FLOOR_H / 2 + 0.34, TOWER_D / 2 + 0.03]}>
        <planeGeometry args={[2.5, 0.42]} />
        <meshBasicMaterial map={signTex} transparent toneMapped={false} />
      </mesh>

      {/* the light this storey throws into the street */}
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -FLOOR_H / 2, 0]} raycast={() => null}>
        <ringGeometry args={[2.6, 7.5, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight
        position={[0, 0, TOWER_D / 2 + 0.6]}
        color={accent}
        intensity={featured ? 7 : 2.2}
        distance={9}
      />
    </group>
  );
}

export default function Tower({ projects, featuredId, onSelect, onHover }) {
  const top = towerTop(projects.length);

  const capTex = useMemo(
    () =>
      labelTexture(
        [
          { text: "KC — STORAGE ARRAY", size: 34, color: "#5d7d73", spacing: 8 },
          { text: `${projects.length} VOLUMES ONLINE`, size: 26, color: "#37514b", spacing: 6 },
        ],
        { width: 1024, height: 256 }
      ),
    [projects.length]
  );

  return (
    <group>
      {/* plinth the building stands on */}
      <RoundedBox
        args={[TOWER_W + 1.5, 0.5, TOWER_D + 1.5]}
        radius={0.08}
        smoothness={3}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <meshStandardMaterial {...dark} />
      </RoundedBox>

      <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.5, 72]} />
        <meshBasicMaterial color="#93F025" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* storeys — listed top-down, stacked bottom-up */}
      {projects.map((p, i) => (
        <Floor
          key={p.id}
          project={p}
          index={i}
          y={floorY(projects.length - 1 - i)}
          featured={p.id === featuredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}

      {/* roof */}
      <group position={[0, top + 0.3, 0]}>
        <RoundedBox args={[TOWER_W + 0.5, 0.4, TOWER_D + 0.5]} radius={0.06} smoothness={3} castShadow>
          <meshStandardMaterial color="#0a1211" roughness={0.4} metalness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[TOWER_W + 0.3, TOWER_D + 0.3]} />
          <meshBasicMaterial map={capTex} transparent toneMapped={false} />
        </mesh>

        {/* mast + beacon */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 2, 8]} />
          <meshStandardMaterial color="#17201f" metalness={0.8} roughness={0.4} />
        </mesh>
        <Beacon />
      </group>
    </group>
  );
}

function Beacon() {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const p = (Math.sin(state.clock.elapsedTime * 2.2) + 1) / 2;
    ref.current.material.emissiveIntensity = 1 + p * 6;
  });

  return (
    <mesh ref={ref} position={[0, 2.2, 0]}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial
        color="#ff5c5c"
        emissive="#ff3b3b"
        emissiveIntensity={3}
        toneMapped={false}
      />
    </mesh>
  );
}
