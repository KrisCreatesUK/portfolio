import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { cover, labelTexture } from "./textures";
import { isTap } from "./gesture";
import { FLOOR_H, TOWER_W, TOWER_D, floorY, towerTop } from "./layout";

/* =========================================================
   HEADQUARTERS
   ---------------------------------------------------------
   The landmark at the middle of the map, and the index to
   everything on it: one storey per project, glazed on all
   four sides so there is always a lit window facing you
   however far round the camera has flown. Look in a window
   and you see the product; press it and you are flown out
   to that product's own place on the map.

   The storeys above the projects are offices with the lights
   half on. They are scenery, and they do not take clicks.
   ========================================================= */

const shell = { color: "#0c1513", roughness: 0.42, metalness: 0.7 };
const dark = { color: "#070d0c", roughness: 0.55, metalness: 0.5 };

const SPARE_FLOORS = 3;
const WIN_H = FLOOR_H - 1.05;

/* windows that are lit, dim, or out — a building with people in it */
/* A storey with a product in it: the same glazed box, but the window on
   every face is that product's screen, and the whole floor takes the click. */
function ProjectStorey({ y, project, featured, onSelect, onHover }) {
  const tex = useTexture(project.shot);
  const edges = useRef([]);
  const screens = useRef([]);

  const faces = facesOf();
  const maps = useMemo(
    () =>
      faces.map((f) => {
        const t = tex.clone();
        t.colorSpace = THREE.SRGBColorSpace;
        return cover(t, f.w / WIN_H);
      }),
    [tex, faces]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const want = featured ? 1 : 0.42;
    screens.current.forEach((m) => {
      if (m) m.opacity = THREE.MathUtils.damp(m.opacity, want, 4, dt);
    });
    edges.current.forEach((m) => {
      if (m) m.opacity = THREE.MathUtils.damp(m.opacity, featured ? 0.9 : 0.22, 4, dt);
    });
  });

  return (
    <group
      position={[0, y, 0]}
      onClick={(e) => {
        if (!isTap()) return;
        e.stopPropagation();
        onSelect(project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(project.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <RoundedBox args={[TOWER_W, FLOOR_H - 0.08, TOWER_D]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial {...shell} />
      </RoundedBox>

      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, (s * (FLOOR_H - 0.08)) / 2, 0]}>
          <boxGeometry args={[TOWER_W + 0.22, 0.12, TOWER_D + 0.22]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}

      {faces.map((f, i) => (
        <group key={f.key} position={f.pos} rotation={f.rot}>
          <mesh>
            <planeGeometry args={[f.w, WIN_H]} />
            <meshBasicMaterial
              ref={(m) => (screens.current[i] = m)}
              map={maps[i]}
              transparent
              opacity={0.42}
              toneMapped={false}
            />
          </mesh>
          <lineSegments position={[0, 0, 0.01]} raycast={() => null}>
            <edgesGeometry args={[new THREE.PlaneGeometry(f.w, WIN_H)]} />
            <lineBasicMaterial
              ref={(m) => (edges.current[i] = m)}
              color={project.accent}
              transparent
              opacity={0.22}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function facesOf() {
  return [
    { key: "n", pos: [0, 0, TOWER_D / 2 + 0.02], rot: [0, 0, 0], w: TOWER_W - 0.5 },
    { key: "s", pos: [0, 0, -TOWER_D / 2 - 0.02], rot: [0, Math.PI, 0], w: TOWER_W - 0.5 },
    { key: "e", pos: [TOWER_W / 2 + 0.02, 0, 0], rot: [0, Math.PI / 2, 0], w: TOWER_D - 0.5 },
    { key: "w", pos: [-TOWER_W / 2 - 0.02, 0, 0], rot: [0, -Math.PI / 2, 0], w: TOWER_D - 0.5 },
  ];
}

function Storey({ y, seed }) {
  const panes = useMemo(() => {
    let a = (seed * 9301 + 49297) % 233280;
    const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    /* bright enough to read as a lit building from across the map */
    return [0, 1, 2, 3].map(() => 0.18 + rnd() * 0.5);
  }, [seed]);

  const faces = facesOf();

  return (
    <group position={[0, y, 0]}>
      <RoundedBox args={[TOWER_W, FLOOR_H - 0.08, TOWER_D]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial {...shell} />
      </RoundedBox>

      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, (s * (FLOOR_H - 0.08)) / 2, 0]}>
          <boxGeometry args={[TOWER_W + 0.22, 0.12, TOWER_D + 0.22]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}

      {faces.map((f, i) => (
        <group key={f.key} position={f.pos} rotation={f.rot}>
          <mesh>
            <planeGeometry args={[f.w, WIN_H]} />
            <meshBasicMaterial color="#9ad84a" transparent opacity={panes[i]} toneMapped={false} />
          </mesh>
          {[-0.3, 0, 0.3].map((o) => (
            <mesh key={o} position={[f.w * o, 0, 0.006]}>
              <planeGeometry args={[0.03, WIN_H]} />
              <meshBasicMaterial color="#060c0b" transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* =========================================================
   FLOODLIGHTING
   ---------------------------------------------------------
   Ground units round the plinth washing the facade, and a
   pair of searchlights sweeping the sky above it. The beams
   are open cylinders blended additively — a cheap stand-in
   for volumetric light that costs nothing and, against a
   black sky, is most of the effect.
   ========================================================= */
function Beam({ from, to, colour, width = 0.26, spread = 2.6, opacity = 0.09 }) {
  const ref = useRef();

  const { mid, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return { mid: a.clone().add(dir.multiplyScalar(0.5)), quat, len };
  }, [from, to]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.material.opacity = opacity * (0.78 + Math.sin(t * 0.9 + mid.x) * 0.22);
  });

  return (
    <mesh ref={ref} position={mid} quaternion={quat} raycast={() => null}>
      <cylinderGeometry args={[width * spread, width, len, 18, 1, true]} />
      <meshBasicMaterial
        color={colour}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Spot({ position, aim, colour, intensity = 55, angle = 0.5 }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    target.position.set(...aim);
    if (light.current) light.current.target = target;
  }, [target, aim]);

  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={position}
        angle={angle}
        penumbra={0.85}
        intensity={intensity}
        distance={44}
        color={colour}
      />
    </>
  );
}

function Floodlights({ top, lite }) {
  /* four units round the plinth, washing the facade */
  const units = useMemo(() => {
    const r = 5.4;
    return [0, 1, 2, 3].map((i) => {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      return { key: i, x: Math.cos(a) * r, z: Math.sin(a) * r };
    });
  }, []);

  const sweep = useRef();

  useFrame((state, delta) => {
    if (!sweep.current) return;
    sweep.current.rotation.y += Math.min(delta, 0.05) * 0.12;
  });

  return (
    <group>
      {units.map((u) => (
        <group key={u.key}>
          {/* the housing on the ground */}
          <mesh position={[u.x, 0.12, u.z]}>
            <cylinderGeometry args={[0.24, 0.32, 0.24, 14]} />
            <meshStandardMaterial color="#121b19" metalness={0.75} roughness={0.45} />
          </mesh>
          <mesh position={[u.x, 0.26, u.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.2, 18]} />
            <meshBasicMaterial color="#d6ffb0" toneMapped={false} />
          </mesh>

          <Beam
            from={[u.x, 0.3, u.z]}
            to={[u.x * 0.18, top + 0.6, u.z * 0.18]}
            colour="#bdff7a"
            width={0.2}
            spread={3.2}
            opacity={0.085}
          />

          <Spot
            position={[u.x, 0.35, u.z]}
            aim={[u.x * 0.1, top * 0.55, u.z * 0.1]}
            colour="#cdffa0"
            intensity={lite ? 28 : 52}
          />
        </group>
      ))}

      {/* two searchlights sweeping the sky over the building */}
      {!lite && (
        <group ref={sweep}>
          {[0, Math.PI].map((a, i) => {
            const x = Math.cos(a) * 13;
            const z = Math.sin(a) * 13;
            return (
              <Beam
                key={i}
                from={[x, 0.4, z]}
                to={[x * 0.25, top + 16, z * 0.25]}
                colour="#93F025"
                width={0.3}
                spread={4.5}
                opacity={0.05}
              />
            );
          })}
        </group>
      )}
    </group>
  );
}

export default function Hq({ lite, projects, featuredId, onSelect, onHover }) {
  const floors = projects.length + SPARE_FLOORS;
  const top = towerTop(floors);

  const capTex = useMemo(
    () =>
      labelTexture(
        [
          { text: "KRISCREATES", size: 34, color: "#5d7d73", spacing: 8 },
          { text: "HEAD OFFICE", size: 26, color: "#37514b", spacing: 6 },
        ],
        { width: 1024, height: 256 }
      ),
    []
  );

  return (
    <group>
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

      <Floodlights top={top} lite={lite} />

      {/* the products, lowest volume at the bottom */}
      {projects.map((p, i) => (
        <ProjectStorey
          key={p.id}
          y={floorY(i)}
          project={p}
          featured={p.id === featuredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}

      {/* offices above, with the lights half on */}
      {Array.from({ length: SPARE_FLOORS }, (_, i) => (
        <Storey key={`spare-${i}`} y={floorY(projects.length + i)} seed={i + 3} />
      ))}

      <group position={[0, top + 0.3, 0]}>
        <RoundedBox args={[TOWER_W + 0.5, 0.4, TOWER_D + 0.5]} radius={0.06} smoothness={3} castShadow>
          <meshStandardMaterial color="#0a1211" roughness={0.4} metalness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[TOWER_W + 0.3, TOWER_D + 0.3]} />
          <meshBasicMaterial map={capTex} transparent opacity={0.5} toneMapped={false} />
        </mesh>

        <RoofSign />

        <mesh position={[0, 3.1, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 2.1, 8]} />
          <meshStandardMaterial color="#17201f" metalness={0.8} roughness={0.4} />
        </mesh>
        <Beacon />
      </group>
    </group>
  );
}

/* =========================================================
   THE ROOFTOP SIGN
   ---------------------------------------------------------
   The building's name, up on a gantry where a real one would
   be. Two double-sided faces crossed at right angles, so the
   name is readable from wherever the tour has got to rather
   than disappearing edge-on for half of every orbit.

   The glow is three things stacked: a dark backing panel so
   it reads as a physical sign, the logo blended additively
   so it burns rather than sits flat, and an oversized copy
   behind it standing in for bloom. It breathes, and every
   several seconds it stutters the way a real sign does.
   ========================================================= */
function RoofSign() {
  const tex = useTexture("/kriscreates-logo-green.png");
  const faces = useRef([]);
  const halos = useRef([]);
  const light = useRef();
  const flick = useRef({ next: 5, burst: 0, level: 1 });

  /* A solid box with a face on each side, not crossed planes — two planes
     through each other read as a modelling mistake from any 3/4 angle, and
     the tour spends most of its time at one. */
  const BOX = 3.25;          // square in plan, so it sits on the roof
  const W = BOX - 0.35;      // the logo inside each face
  const H = W * (200 / 850);
  const PANEL = H + 0.42;

  const SIDES = [
    { pos: [0, 0, BOX / 2], rot: [0, 0, 0] },
    { pos: [0, 0, -BOX / 2], rot: [0, Math.PI, 0] },
    { pos: [BOX / 2, 0, 0], rot: [0, Math.PI / 2, 0] },
    { pos: [-BOX / 2, 0, 0], rot: [0, -Math.PI / 2, 0] },
  ];

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const f = flick.current;

    /* a slow breath, so it is never completely static */
    let level = 0.88 + Math.sin(t * 1.3) * 0.12;

    /* and every so often, the stutter of a tube warming up */
    f.next -= dt;
    if (f.next <= 0) {
      f.burst = 0.4;
      f.next = 7 + Math.random() * 9;
    }
    if (f.burst > 0) {
      f.burst -= dt;
      if (Math.random() > 0.55) level *= 0.22;
    }

    f.level = THREE.MathUtils.damp(f.level, level, 18, dt);

    faces.current.forEach((m) => m && (m.opacity = f.level));
    halos.current.forEach((m) => m && (m.opacity = 0.28 * f.level));
    if (light.current) light.current.intensity = 5 + f.level * 7;
  });

  return (
    <group position={[0, 1.5, 0]}>
      {/* the gantry it stands on */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, -0.6, 0]}>
          <boxGeometry args={[0.07, 0.95, 0.07]} />
          <meshStandardMaterial color="#17201f" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}

      {/* the sign body */}
      <mesh castShadow>
        <boxGeometry args={[BOX, PANEL, BOX]} />
        <meshStandardMaterial color="#050a09" metalness={0.6} roughness={0.55} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(BOX, PANEL, BOX)]} />
        <lineBasicMaterial color="#93F025" transparent opacity={0.5} />
      </lineSegments>

      {SIDES.map((side, i) => (
        <group key={i} position={side.pos} rotation={side.rot}>
          {/* standing in for a bloom pass */}
          <mesh position={[0, 0, 0.006]} scale={1.05} raycast={() => null}>
            <planeGeometry args={[W, H]} />
            <meshBasicMaterial
              ref={(m) => (halos.current[i] = m)}
              map={tex}
              transparent
              opacity={0.28}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* the name itself */}
          <mesh position={[0, 0, 0.014]} raycast={() => null}>
            <planeGeometry args={[W, H]} />
            <meshBasicMaterial
              ref={(m) => (faces.current[i] = m)}
              map={tex}
              transparent
              opacity={1}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}

      <pointLight ref={light} position={[0, 0, 0]} color="#93F025" intensity={9} distance={12} />
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
    <mesh ref={ref} position={[0, 4.2, 0]}>
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
