import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, Line } from "@react-three/drei";
import * as THREE from "three";

import { labelTexture, cover } from "./textures";
import { driveY, DRIVE_D } from "./layout";

/* Where each panel parks when it isn't the selected one.
   The camera sits front-left, so +x reads as "right of the rack". */
const PARKED = [
  [-3.4, 4.4, -1.2],
  [4.3, 1.3, -1.6],
  [-2.9, 0.9, 2.4],
];

const FOCUS = [1.85, 3.9, 1.5];

/* =========================================================
   A FLOATING SCREEN
   ========================================================= */
function Panel({ project, index, total, active, dimmed, onSelect, onHover }) {
  const group = useRef();
  const inner = useRef();
  const scan = useRef();

  const tex = useTexture(project.shot);
  const portrait = project.shotFit === "portrait";
  const w = active ? (portrait ? 1.4 : 2.6) : portrait ? 0.95 : 1.7;
  const h = portrait ? w * 1.62 : w * 0.63;

  const mapped = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    return cover(t, w / h);
  }, [tex, w, h]);

  const capTex = useMemo(
    () =>
      labelTexture(
        [
          { text: project.code, size: 30, color: project.accent, spacing: 8 },
          { text: project.name, size: 34, color: "#e2ece2", spacing: 2, font: "sans-serif" },
        ],
        { width: 900, height: 150 }
      ),
    [project]
  );

  const target = new THREE.Vector3();
  const parked = PARKED[index % PARKED.length];

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    const bob = Math.sin(t * 0.7 + index * 2) * 0.09;

    /* narrow viewports can't fit the full spread, so pull everything inwards */
    const k = THREE.MathUtils.clamp(state.viewport.aspect, 0.5, 1.2) / 1.2;

    if (active) target.set(FOCUS[0] * k, FOCUS[1] + bob * 0.5, FOCUS[2] * k);
    else target.set(parked[0] * k, parked[1] + bob, parked[2] * k);

    g.position.lerp(target, 1 - Math.pow(0.001, dt));
    g.lookAt(state.camera.position);

    if (inner.current) {
      const s = active ? 1 : dimmed ? 0.9 : 1;
      inner.current.scale.setScalar(THREE.MathUtils.damp(inner.current.scale.x, s, 5, dt));
    }

    if (scan.current) {
      scan.current.position.y = ((t * 0.35 + index * 0.4) % 1) * h - h / 2;
    }
  });

  const anchor = useMemo(
    () => new THREE.Vector3(0, driveY(total - 1 - index), DRIVE_D / 2 + 0.1),
    [index, total]
  );

  return (
    <>
      <group
        ref={group}
        position={parked}
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
        <group ref={inner}>
          {/* glass backing */}
          <mesh position={[0, 0, -0.012]}>
            <planeGeometry args={[w + 0.16, h + 0.5]} />
            <meshBasicMaterial color="#050a09" transparent opacity={active ? 0.86 : 0.66} />
          </mesh>

          {/* frame */}
          <lineSegments position={[0, 0, -0.01]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(w + 0.16, h + 0.5)]} />
            <lineBasicMaterial color={project.accent} transparent opacity={active ? 0.95 : 0.4} />
          </lineSegments>

          {/* the screenshot */}
          <mesh>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial
              map={mapped}
              toneMapped={false}
              transparent
              opacity={active ? 1 : dimmed ? 0.55 : 0.8}
            />
          </mesh>

          {/* scan line sweeping the image */}
          <mesh ref={scan} position={[0, 0, 0.004]}>
            <planeGeometry args={[w, 0.035]} />
            <meshBasicMaterial color={project.accent} transparent opacity={active ? 0.5 : 0.25} />
          </mesh>

          {/* caption plate */}
          <mesh position={[0, -h / 2 - 0.17, 0.002]}>
            <planeGeometry args={[w, 0.26]} />
            <meshBasicMaterial map={capTex} transparent toneMapped={false} />
          </mesh>

          {/* corner ticks */}
          {[
            [-1, 1],
            [1, 1],
            [-1, -1],
            [1, -1],
          ].map(([sx, sy], i) => (
            <mesh key={i} position={[(sx * (w + 0.16)) / 2, (sy * (h + 0.5)) / 2, 0.003]}>
              <planeGeometry args={[0.12, 0.02]} />
              <meshBasicMaterial color={project.accent} transparent opacity={active ? 1 : 0.5} />
            </mesh>
          ))}
        </group>
      </group>

      {/* tether back to its drive bay */}
      <Tether from={anchor} to={group} accent={project.accent} active={active} />
    </>
  );
}

/* A line that follows the panel as it moves */
function Tether({ from, to, accent, active }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current || !to.current) return;
    ref.current.geometry.setFromPoints([from, to.current.position]);
  });

  return (
    <Line
      ref={ref}
      points={[from, from.clone().add(new THREE.Vector3(0, 0.01, 0))]}
      color={accent}
      transparent
      opacity={active ? 0.5 : 0.18}
      lineWidth={1}
      dashed={false}
    />
  );
}

export default function Panels({ projects, activeId, hoverId, onSelect, onHover }) {
  return (
    <>
      {projects.map((p, i) => (
        <Panel
          key={p.id}
          project={p}
          index={i}
          total={projects.length}
          active={p.id === activeId}
          dimmed={Boolean(activeId) && p.id !== activeId && p.id !== hoverId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </>
  );
}
