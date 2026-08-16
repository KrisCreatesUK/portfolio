import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import Rack from "./Rack";
import { driveY, rng } from "./layout";
import Panels from "./Panels";
import { gridTexture } from "./textures";

/* =========================================================
   CAMERA — slow orbit, mouse parallax, eases to the
   selected bay's height
   ========================================================= */
function Rig({ activeIndex, total }) {
  const { camera, pointer } = useThree();
  const look = useRef(new THREE.Vector3(0, 2, 0));

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    const radius = 13.8;
    const angle = -0.62 + Math.sin(t * 0.055) * 0.24 + pointer.x * 0.14;
    const height = 5.3 + Math.sin(t * 0.08) * 0.45 - pointer.y * 0.8;

    const target = new THREE.Vector3(
      Math.sin(angle) * radius,
      height,
      Math.cos(angle) * radius
    );

    camera.position.lerp(target, 1 - Math.pow(0.0015, dt));

    const bayY = activeIndex >= 0 ? driveY(total - 1 - activeIndex) : 2;
    look.current.lerp(new THREE.Vector3(0, bayY * 0.35 + 1.5, 0), 1 - Math.pow(0.01, dt));
    camera.lookAt(look.current);
  });

  return null;
}

/* =========================================================
   FLOOR + AMBIENT MOTION
   ========================================================= */
function Floor() {
  const tex = useMemo(() => {
    const t = gridTexture();
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]} receiveShadow>
      <planeGeometry args={[46, 46]} />
      <meshBasicMaterial map={tex} transparent opacity={0.95} />
    </mesh>
  );
}

function Rings() {
  const g = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    g.current?.children.forEach((ring, i) => {
      const phase = ((t * 0.16 + i / 3) % 1);
      const s = 2.4 + phase * 9;
      ring.scale.set(s, s, s);
      ring.material.opacity = 0.32 * (1 - phase);
    });
  });

  return (
    <group ref={g} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.98, 1, 96]} />
          <meshBasicMaterial color="#93F025" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Motes({ count = 260 }) {
  const ref = useRef();

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const rand = rng();
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 1.6 + rand() * 7.5;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = rand() * 9 - 0.3;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.12 + rand() * 0.35;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((state, dt) => {
    const arr = ref.current?.geometry.attributes.position.array;
    if (!arr) return;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      if (arr[i * 3 + 1] > 9) arr[i * 3 + 1] = -0.3;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y += dt * 0.014;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#93F025"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* Volumetric-ish shaft of light over the array */
function Beam() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.05 + Math.sin(state.clock.elapsedTime * 0.6) * 0.018;
    }
  });

  return (
    <mesh ref={ref} position={[0, 6.4, 0]}>
      <cylinderGeometry args={[0.5, 3.1, 12, 40, 1, true]} />
      <meshBasicMaterial
        color="#93F025"
        transparent
        opacity={0.06}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* =========================================================
   STAGE
   ========================================================= */
export default function Stage({ projects, activeId, hoverId, onSelect, onHover }) {
  const activeIndex = projects.findIndex((p) => p.id === activeId);

  return (
    <Canvas
      className="stage-canvas"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [-6.2, 4.8, 8.4], fov: 34, near: 0.1, far: 120 }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={["#030404"]} />
      <fog attach="fog" args={["#030404", 14, 32]} />

      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 11, 7]} intensity={2.4} color="#e8ffdd" />
      <directionalLight position={[-9, 5, -6]} intensity={1.5} color="#6fd42a" />
      <spotLight
        position={[-4, 9, 6]}
        angle={0.7}
        penumbra={0.8}
        intensity={90}
        distance={26}
        color="#ffffff"
      />
      <pointLight position={[0, 1.6, 4.5]} intensity={9} distance={13} color="#93F025" />
      <pointLight position={[3, 3.5, -3]} intensity={6} distance={14} color="#57B41A" />

      <Suspense fallback={null}>
        <Rack
          projects={projects}
          activeId={activeId}
          hoverId={hoverId}
          onSelect={onSelect}
          onHover={onHover}
        />
        <Panels
          projects={projects}
          activeId={activeId}
          hoverId={hoverId}
          onSelect={onSelect}
          onHover={onHover}
        />
      </Suspense>

      <Floor />
      <Rings />
      <Motes />
      <Beam />

      <Rig activeIndex={activeIndex} total={projects.length} />
    </Canvas>
  );
}
