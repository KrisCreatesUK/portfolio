import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, Line } from "@react-three/drei";
import * as THREE from "three";

import { labelTexture, cover } from "./textures";
import { driveY, DRIVE_D } from "./layout";

/* =========================================================
   THE PREVIEW SCREEN
   ---------------------------------------------------------
   There used to be one of these per project, floating around
   the array all the time. They looked good and they ruined
   the thing: four big planes parked over the rack hid the
   drives and, worse, ate the clicks meant for them.

   So there is one screen now. It belongs to whichever drive
   you are pointing at, it parks well clear of the array, and
   it is invisible to the raycaster — the drive underneath
   always gets the click.
   ========================================================= */

/* Clear of the rack, up and to the right. */
const PREVIEW = [4.3, 4.6, 1.1];

function Panel({ project, index, total, shown, dimmed }) {
  const group = useRef();
  const inner = useRef();
  const scan = useRef();
  const shot = useRef();
  const fade = useRef(0);

  const tex = useTexture(project.shot);
  const portrait = project.shotFit === "portrait";
  const w = portrait ? 1.5 : 2.7;
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

  /* Drawn over the rack regardless of depth, but never hit-tested: the
     screen is a readout, the drive is the control. */
  const overlay = { depthTest: false, depthWrite: false };
  const noHit = () => null;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    fade.current = THREE.MathUtils.damp(fade.current, shown ? 1 : 0, 6, dt);
    g.visible = fade.current > 0.015;
    if (!g.visible) return;

    const bob = Math.sin(t * 0.7 + index * 2) * 0.07;
    /* narrow viewports can't fit the spread, so pull it inwards */
    const k = THREE.MathUtils.clamp(state.viewport.aspect, 0.55, 1.2) / 1.2;

    target.set(PREVIEW[0] * k, PREVIEW[1] + bob, PREVIEW[2] * k);
    g.position.lerp(target, 1 - Math.pow(0.0025, dt));
    g.lookAt(state.camera.position);

    if (inner.current) {
      /* it arrives by scaling up out of nothing, like it is being drawn */
      const s = 0.82 + fade.current * 0.18;
      inner.current.scale.set(s, s, s);
    }

    if (shot.current) {
      shot.current.material.opacity = (dimmed ? 0.7 : 1) * fade.current;
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
      <group ref={group} position={PREVIEW} visible={false}>
        <group ref={inner}>
          {/* glass backing */}
          <mesh position={[0, 0, -0.012]} renderOrder={100} raycast={noHit}>
            <planeGeometry args={[w + 0.16, h + 0.5]} />
            <meshBasicMaterial color="#050a09" transparent opacity={0.86} {...overlay} />
          </mesh>

          {/* frame */}
          <lineSegments position={[0, 0, -0.01]} renderOrder={101} raycast={noHit}>
            <edgesGeometry args={[new THREE.PlaneGeometry(w + 0.16, h + 0.5)]} />
            <lineBasicMaterial color={project.accent} transparent opacity={0.95} {...overlay} />
          </lineSegments>

          {/* the screenshot */}
          <mesh ref={shot} renderOrder={102} raycast={noHit}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial map={mapped} toneMapped={false} transparent opacity={1} {...overlay} />
          </mesh>

          {/* scan line */}
          <mesh ref={scan} position={[0, 0, 0.004]} renderOrder={103} raycast={noHit}>
            <planeGeometry args={[w, 0.035]} />
            <meshBasicMaterial color={project.accent} transparent opacity={0.5} {...overlay} />
          </mesh>

          {/* caption plate */}
          <mesh position={[0, -h / 2 - 0.17, 0.002]} renderOrder={104} raycast={noHit}>
            <planeGeometry args={[w, 0.26]} />
            <meshBasicMaterial map={capTex} transparent toneMapped={false} {...overlay} />
          </mesh>

          {/* corner ticks */}
          {[
            [-1, 1],
            [1, 1],
            [-1, -1],
            [1, -1],
          ].map(([sx, sy], i) => (
            <mesh
              key={i}
              position={[(sx * (w + 0.16)) / 2, (sy * (h + 0.5)) / 2, 0.003]}
              renderOrder={105}
              raycast={noHit}
            >
              <planeGeometry args={[0.12, 0.02]} />
              <meshBasicMaterial color={project.accent} transparent opacity={1} {...overlay} />
            </mesh>
          ))}
        </group>
      </group>

      {/* the line back to the bay it belongs to */}
      <Tether from={anchor} to={group} accent={project.accent} />
    </>
  );
}

/* A line that follows the screen as it moves */
function Tether({ from, to, accent }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current || !to.current) return;
    ref.current.visible = to.current.visible;
    if (!to.current.visible) return;
    ref.current.geometry.setFromPoints([from, to.current.position]);
  });

  return (
    <Line
      ref={ref}
      points={[from, from.clone().add(new THREE.Vector3(0, 0.01, 0))]}
      color={accent}
      transparent
      opacity={0.45}
      lineWidth={1}
      dashed={false}
      depthTest={false}
      renderOrder={90}
      raycast={() => null}
    />
  );
}

export default function Panels({ projects, activeId, hoverId, mode }) {
  /* what you are pointing at wins; otherwise the mounted volume */
  const shownId = hoverId ?? (mode === "project" ? activeId : null);

  return (
    <>
      {projects.map((p, i) => (
        <Panel
          key={p.id}
          project={p}
          index={i}
          total={projects.length}
          shown={p.id === shownId}
          dimmed={mode === "project" && p.id !== activeId}
        />
      ))}
    </>
  );
}
