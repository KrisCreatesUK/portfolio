import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { rng } from "./layout";
import { gridTexture } from "./textures";

/* =========================================================
   THE SPACE AROUND THE ARRAY
   ---------------------------------------------------------
   The rack used to sit on a small lit plinth with nothing
   behind it, which reads as a product shot. This gives it a
   city to stand in: a floor that runs past the fog, towers
   on the horizon, data climbing between them, and a sky
   grid overhead — so moving the camera actually goes
   somewhere.

   Everything here is geometry and additive lines. No
   textures are fetched; the only canvas texture is the
   floor, drawn in textures.js.
   ========================================================= */

const ACC = "#93F025";
const ACC_DEEP = "#2d650e";

/* ---------------------------------------------------------
   FLOOR — the near grid, plus a far plane that carries the
   eye out to the fog so there is no visible edge.
--------------------------------------------------------- */
function Floor() {
  const tex = useMemo(() => {
    const t = gridTexture();
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, []);

  const far = useMemo(() => {
    const t = gridTexture();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(9, 9);
    return t;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.17, 0]} receiveShadow>
        <planeGeometry args={[46, 46]} />
        <meshBasicMaterial map={tex} transparent opacity={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial map={far} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   TOWERS — other arrays, far enough out to read as a skyline.
   One geometry, one material, instanced: 40 towers cost
   about as much as one.
--------------------------------------------------------- */
function Towers({ count = 44 }) {
  const mesh = useRef();
  const edges = useRef();

  const { matrices, box } = useMemo(() => {
    const rand = rng(99221);
    const matrices = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      /* a clearing around the rack, then a band of towers */
      const r = 26 + rand() * 78;
      const h = 4 + rand() * 30;
      const w = 1.6 + rand() * 3.4;

      dummy.position.set(Math.cos(a) * r, h / 2 - 0.2, Math.sin(a) * r);
      dummy.scale.set(w, h, w * (0.7 + rand() * 0.6));
      dummy.rotation.y = rand() * Math.PI;
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
    return { matrices, box: new THREE.BoxGeometry(1, 1, 1) };
  }, [count]);

  /* set the matrices once the instanced mesh exists */
  const onMesh = (m) => {
    mesh.current = m;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
  };

  const onEdges = (m) => {
    edges.current = m;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
  };

  return (
    <group>
      <instancedMesh ref={onMesh} args={[box, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial color="#060c0b" />
      </instancedMesh>

      {/* the lit edge is what actually makes them read in the dark */}
      <instancedMesh ref={onEdges} args={[box, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial
          color={ACC_DEEP}
          wireframe
          transparent
          opacity={0.34}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

/* ---------------------------------------------------------
   DATA STREAMS — points climbing the towers. Cheap, and it
   stops the skyline looking like furniture.
--------------------------------------------------------- */
function Streams({ count = 900 }) {
  const ref = useRef();

  const { positions, speeds, tops } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const tops = new Float32Array(count);
    const rand = rng(5150);

    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 22 + rand() * 80;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = rand() * 34;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 1.6 + rand() * 5.5;
      tops[i] = 16 + rand() * 24;
    }
    return { positions, speeds, tops };
  }, [count]);

  useFrame((_, dt) => {
    const arr = ref.current?.geometry.attributes.position.array;
    if (!arr) return;
    const step = Math.min(dt, 0.05);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * step;
      if (arr[i * 3 + 1] > tops[i]) arr[i * 3 + 1] = -0.2;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color={ACC}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------------------------------------------------
   MOTES — the slow dust immediately around the rack, kept
   from the original scene because it sells the scale.
--------------------------------------------------------- */
function Motes({ count = 300 }) {
  const ref = useRef();

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const rand = rng();
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 1.6 + rand() * 9;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = rand() * 10 - 0.3;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.12 + rand() * 0.35;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((_, dt) => {
    const arr = ref.current?.geometry.attributes.position.array;
    if (!arr) return;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      if (arr[i * 3 + 1] > 10) arr[i * 3 + 1] = -0.3;
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
        color={ACC}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------------------------------------------------
   HORIZON — a ring at the edge of the fog, so the world
   ends in a glow rather than in nothing.
--------------------------------------------------------- */
function Horizon() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[118, 150, 96]} />
        <meshBasicMaterial
          color={ACC_DEEP}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* sky grid: the ceiling of the space */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 46, 0]}>
        <ringGeometry args={[10, 150, 64, 8]} />
        <meshBasicMaterial
          color={ACC_DEEP}
          wireframe
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   PULSE RINGS on the plinth — kept from the original.
--------------------------------------------------------- */
function Rings() {
  const g = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    g.current?.children.forEach((ring, i) => {
      const phase = (t * 0.16 + i / 3) % 1;
      const s = 2.4 + phase * 11;
      ring.scale.set(s, s, s);
      ring.material.opacity = 0.3 * (1 - phase);
    });
  });

  return (
    <group ref={g} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.98, 1, 96]} />
          <meshBasicMaterial color={ACC} transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* Shaft of light over the array */
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
        color={ACC}
        transparent
        opacity={0.06}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function Cyberspace({ lite = false }) {
  return (
    <group>
      <Floor />
      <Horizon />
      <Towers count={lite ? 22 : 44} />
      <Streams count={lite ? 300 : 900} />
      <Motes count={lite ? 120 : 300} />
      <Rings />
      <Beam />
    </group>
  );
}
