import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { labelTexture, cover } from "./textures";
import { isTap } from "./gesture";

/* =========================================================
   A MONUMENT
   ---------------------------------------------------------
   One per project, standing on its own out on the map rather
   than stacked inside the headquarters. Each is a different
   silhouette, so you can tell them apart from across the
   plain before you can read a word on them — which is the
   whole point of putting them out there.

     arcade  CompKit        a cabinet: raked screen, side pylons
     pin     Truck It       a map marker: tapered mast, ringed head
     card    Pokellectr     a card standing upright in its frame
     portal  ClippD         a ring with the screen hung inside it

   Everything below the screen is shared: plinth, ground ring,
   name plate, and one invisible slab that takes the taps.
   ========================================================= */

const stone = { color: "#0b1312", roughness: 0.5, metalness: 0.55 };
const dark = { color: "#070d0c", roughness: 0.6, metalness: 0.4 };

/* Built at roughly head height and then stood up, so from the ring road a
   monument reads as a landmark rather than a model on a table. */
const MONUMENT_SCALE = 1.3;

export default function Monument({ project, kind, position, facing, featured, onSelect, onHover }) {
  const group = useRef();
  const screen = useRef();
  const ring = useRef();
  const halo = useRef();

  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);
  const tex = useTexture(project.shot);

  /* the screen each monument carries, cropped to its own frame */
  const SCREEN = { arcade: [4.2, 2.6], pin: [2.9, 1.85], card: [2.7, 3.8], portal: [3.4, 2.1] }[kind];

  const map = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    return cover(t, SCREEN[0] / SCREEN[1]);
  }, [tex, SCREEN]);

  const signTex = useMemo(
    () =>
      labelTexture(
        [
          { text: project.code, size: 30, color: project.accent, spacing: 9, font: "monospace" },
          { text: project.name.toUpperCase(), size: 36, color: "#dbe8dc", spacing: 3, font: "sans-serif" },
        ],
        { width: 1024, height: 170 }
      ),
    [project]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (screen.current) {
      screen.current.material.opacity = THREE.MathUtils.damp(
        screen.current.material.opacity,
        featured ? 1 : 0.4,
        4,
        dt
      );
    }

    if (ring.current) {
      /* the ground ring pulses outward when this is the one in front of you */
      const base = featured ? 1 : 0.55;
      const p = featured ? (t * 0.5) % 1 : 0;
      ring.current.scale.setScalar(base + p * 0.5);
      ring.current.material.opacity = (featured ? 0.5 : 0.16) * (1 - p * 0.8);
    }

    if (halo.current) {
      halo.current.material.opacity = THREE.MathUtils.damp(
        halo.current.material.opacity,
        featured ? 0.26 : 0.05,
        4,
        dt
      );
    }

    if (group.current) {
      const want = featured ? MONUMENT_SCALE : MONUMENT_SCALE * 0.94;
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, want, 4, dt));
    }
  });

  const [sw, sh] = SCREEN;

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, facing, 0]}
      onClick={(e) => {
        if (!isTap()) return;      // that was a flight, not a choice
        e.stopPropagation();
        onSelect(project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(project.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      {/* the tap target: one slab covering the whole thing */}
      <mesh position={[0, 3.4, 0.4]} visible={false}>
        <boxGeometry args={[6, 8.4, 3]} />
        <meshBasicMaterial />
      </mesh>

      {/* plinth, shared */}
      <RoundedBox args={[5.6, 0.7, 4.4]} radius={0.1} smoothness={3} position={[0, 0.35, 0]} receiveShadow>
        <meshStandardMaterial {...dark} />
      </RoundedBox>

      {/* the ring it stands in, which pulses when it is the live one */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} raycast={() => null}>
        <ringGeometry args={[4.2, 4.5, 64]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* light it throws on the ground */}
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={() => null}>
        <circleGeometry args={[7.5, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {kind === "arcade" && <Arcade accent={accent} />}
      {kind === "pin" && <Pin accent={accent} />}
      {kind === "card" && <CardStone accent={accent} />}
      {kind === "portal" && <Portal accent={accent} />}

      {/* the screen, positioned per shape */}
      <group position={SCREEN_AT[kind]} rotation={SCREEN_TILT[kind]}>
        <mesh ref={screen}>
          <planeGeometry args={[sw, sh]} />
          <meshBasicMaterial map={map} toneMapped={false} transparent opacity={0.4} />
        </mesh>
        <lineSegments position={[0, 0, 0.01]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(sw, sh)]} />
          <lineBasicMaterial color={accent} transparent opacity={featured ? 1 : 0.45} />
        </lineSegments>
      </group>

      {/* name plate on the plinth */}
      <mesh position={[0, 0.42, 2.22]}>
        <planeGeometry args={[3.4, 0.56]} />
        <meshBasicMaterial map={signTex} transparent toneMapped={false} />
      </mesh>

      <pointLight position={[0, 4, 2.6]} color={accent} intensity={featured ? 26 : 9} distance={22} />
    </group>
  );
}

/* where the screen sits on each silhouette */
const SCREEN_AT = {
  arcade: [0, 3.5, 1.5],
  pin: [0, 6.3, 0.72],
  card: [0, 4.3, 0.34],
  portal: [0, 4.5, 0.12],
};

const SCREEN_TILT = {
  arcade: [-0.22, 0, 0],
  pin: [0, 0, 0],
  card: [0, 0, 0],
  portal: [0, 0, 0],
};

/* ---------------------------------------------------------
   CompKit — a cabinet
--------------------------------------------------------- */
function Arcade({ accent }) {
  return (
    <group>
      <RoundedBox args={[5, 2.6, 2.6]} radius={0.1} smoothness={3} position={[0, 2, -0.1]} castShadow>
        <meshStandardMaterial {...stone} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[0.5, 5.6, 2.2]}
          radius={0.08}
          smoothness={3}
          position={[s * 2.55, 3.4, -0.1]}
          castShadow
        >
          <meshStandardMaterial {...stone} />
        </RoundedBox>
      ))}
      {/* crown */}
      <mesh position={[0, 6.4, -0.1]}>
        <boxGeometry args={[5.8, 0.3, 2.4]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 6.6, -0.1]}>
        <boxGeometry args={[5.4, 0.07, 2]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Truck It — a map marker
--------------------------------------------------------- */
function Pin({ accent }) {
  return (
    <group>
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.55, 1.1, 4.4, 8]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      {/* the head of the pin */}
      <mesh position={[0, 6.3, 0]} castShadow>
        <torusGeometry args={[2.1, 0.32, 10, 36]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      <mesh position={[0, 6.3, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[2.1, 0.08, 8, 36]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {/* the point underneath */}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial {...dark} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Pokellectr — a card stood on end
--------------------------------------------------------- */
function CardStone({ accent }) {
  return (
    <group>
      <RoundedBox args={[3.4, 4.8, 0.5]} radius={0.16} smoothness={4} position={[0, 4.3, 0]} castShadow>
        <meshStandardMaterial {...stone} />
      </RoundedBox>
      {/* the frame edge, lit */}
      <lineSegments position={[0, 4.3, 0.26]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(3.2, 4.6)]} />
        <lineBasicMaterial color={accent} transparent opacity={0.8} />
      </lineSegments>
      {/* two buttresses, so a thin slab does not look like it would fall */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.9, 1.5, 0]} rotation={[0, 0, s * 0.22]}>
          <boxGeometry args={[0.3, 2.6, 1.1]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------
   ClippD — a ring with the screen hung in it
--------------------------------------------------------- */
function Portal({ accent }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.12;
  });

  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.4, 1.8, 0]} castShadow>
          <boxGeometry args={[0.5, 3.6, 0.9]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      ))}
      <mesh position={[0, 4.5, 0]} castShadow>
        <torusGeometry args={[2.75, 0.34, 12, 44]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      {/* a slowly turning inner ring, so it reads as running */}
      <mesh ref={ref} position={[0, 4.5, 0]}>
        <torusGeometry args={[2.4, 0.055, 8, 44]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
