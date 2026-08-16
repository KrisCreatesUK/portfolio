import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { labelTexture, cover } from "./textures";
import { DRIVE_W, DRIVE_D, DRIVE_H, PITCH, driveY } from "./layout";

const metal = { color: "#1b2926", roughness: 0.34, metalness: 0.72 };
const dark = { color: "#101a18", roughness: 0.5, metalness: 0.6 };

/* =========================================================
   ONE DRIVE
   ========================================================= */
function Drive({ project, y, active, hovered, onSelect, onHover }) {
  const group = useRef();
  const led = useRef();
  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);

  const nameTex = useMemo(
    () =>
      labelTexture(
        [
          { text: project.code, size: 26, color: project.accent, spacing: 7, font: "monospace" },
          { text: project.name.toUpperCase(), size: 34, color: "#d8e6da", spacing: 3, font: "sans-serif" },
        ],
        { width: 1024, height: 180 }
      ),
    [project]
  );

  const shot = useTexture(project.shot);
  const faceTex = useMemo(() => {
    const t = shot.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    return cover(t, 1.55);
  }, [shot]);

  useFrame((state, dt) => {
    if (!group.current) return;
    const out = active ? 1.15 : hovered ? 0.4 : 0;
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, out, 5, dt);

    const t = state.clock.elapsedTime;
    if (led.current) {
      led.current.material.emissiveIntensity = active
        ? 3.4
        : 1.1 + Math.sin(t * 2.4 + y * 3) * 0.7;
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
      {/* chassis */}
      <RoundedBox args={[DRIVE_W, DRIVE_H, DRIVE_D]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial {...metal} />
      </RoundedBox>

      {/* front face plate */}
      <mesh position={[0, 0, DRIVE_D / 2 + 0.002]}>
        <planeGeometry args={[DRIVE_W - 0.12, DRIVE_H - 0.08]} />
        <meshStandardMaterial color="#101b19" roughness={0.42} metalness={0.55} />
      </mesh>

      {/* edge highlight so the chassis reads against the dark */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(DRIVE_W, DRIVE_H, DRIVE_D)]} />
        <lineBasicMaterial
          color={active || hovered ? project.accent : "#4b6660"}
          transparent
          opacity={active ? 0.95 : hovered ? 0.7 : 0.45}
        />
      </lineSegments>

      {/* little screen showing the project */}
      <mesh position={[-DRIVE_W / 2 + 0.62, 0, DRIVE_D / 2 + 0.006]}>
        <planeGeometry args={[0.86, 0.36]} />
        <meshBasicMaterial map={faceTex} toneMapped={false} opacity={active ? 1 : 0.72} transparent />
      </mesh>
      <mesh position={[-DRIVE_W / 2 + 0.62, 0, DRIVE_D / 2 + 0.005]}>
        <planeGeometry args={[0.92, 0.42]} />
        <meshBasicMaterial color={project.accent} opacity={active ? 0.55 : 0.22} transparent />
      </mesh>

      {/* etched label */}
      <mesh position={[0.62, 0.02, DRIVE_D / 2 + 0.006]}>
        <planeGeometry args={[1.7, 0.3]} />
        <meshBasicMaterial map={nameTex} transparent toneMapped={false} />
      </mesh>

      {/* accent strip along the front */}
      <mesh position={[0.62, -0.19, DRIVE_D / 2 + 0.006]}>
        <planeGeometry args={[active ? 1.7 : hovered ? 1.0 : 0.42, 0.028]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={active ? 1 : 0.65} />
      </mesh>

      {/* status LED */}
      <mesh ref={led} position={[DRIVE_W / 2 - 0.16, 0.14, DRIVE_D / 2 + 0.01]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* vents */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[DRIVE_W / 2 - 0.42 - i * 0.1, -0.16, DRIVE_D / 2 + 0.006]}>
          <planeGeometry args={[0.035, 0.14]} />
          <meshBasicMaterial color="#16211f" />
        </mesh>
      ))}

      {/* underside glow when pulled out */}
      <pointLight
        position={[0, -0.1, DRIVE_D / 2]}
        color={accent}
        intensity={active ? 2.6 : 0}
        distance={3}
      />
    </group>
  );
}

/* =========================================================
   THE ARRAY
   ========================================================= */
export default function Rack({ projects, activeId, hoverId, onSelect, onHover }) {
  const capY = driveY(projects.length - 1) + PITCH * 0.72;

  const capTex = useMemo(
    () =>
      labelTexture(
        [
          { text: "KC — STORAGE ARRAY", size: 34, color: "#5d7d73", spacing: 8 },
          { text: `MOUNTED / ${projects.length} VOL`, size: 26, color: "#37514b", spacing: 6 },
        ],
        { width: 1024, height: 256 }
      ),
    [projects.length]
  );

  return (
    <group>
      {/* plinth */}
      <RoundedBox args={[DRIVE_W + 0.55, 0.34, DRIVE_D + 0.5]} radius={0.06} smoothness={3} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial {...dark} />
      </RoundedBox>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 1.96, 64]} />
        <meshBasicMaterial color="#93F025" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>

      {/* corner posts */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (DRIVE_W / 2 + 0.16), capY / 2 + 0.1, sz * (DRIVE_D / 2 + 0.12)]}>
          <boxGeometry args={[0.14, capY, 0.14]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      ))}

      {/* drives — listed top-down, stacked bottom-up */}
      {projects.map((p, i) => (
        <Drive
          key={p.id}
          project={p}
          y={driveY(projects.length - 1 - i)}
          active={p.id === activeId}
          hovered={p.id === hoverId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}

      {/* cap */}
      <group position={[0, capY + 0.24, 0]}>
        <RoundedBox args={[DRIVE_W + 0.4, 0.22, DRIVE_D + 0.36]} radius={0.05} smoothness={3} castShadow>
          <meshStandardMaterial color="#131d1b" roughness={0.35} metalness={0.85} />
        </RoundedBox>
        <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[DRIVE_W + 0.3, DRIVE_D + 0.26]} />
          <meshBasicMaterial map={capTex} transparent toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
