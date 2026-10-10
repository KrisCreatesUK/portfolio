import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";

import World from "./World";
import Cyberspace from "./Cyberspace";
import CameraRig from "./CameraRig";
import Ship from "./Ship";

/* =========================================================
   STAGE
   ---------------------------------------------------------
   The canvas sits fixed behind the whole page now, not in a
   box at the top. Everything the visitor reads is DOM drawn
   over it — which keeps the copy and the outbound links in
   the markup where crawlers can still find them.
   ========================================================= */

function useLite() {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const check = () => {
      const narrow = window.innerWidth < 760;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const fewCores = (navigator.hardwareConcurrency || 8) <= 4;
      setLite(narrow || (coarse && fewCores));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return lite;
}

export default function Stage({
  projects,
  activeId,
  hoverId,
  featuredId,
  pickIndex,
  mode,
  progressRef,
  onSelect,
  onHover,
  onFeature,
}) {
  const lite = useLite();
  const focusIndex = projects.findIndex((p) => p.id === activeId);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      className="stage-canvas"
      dpr={[1, lite ? 1.35 : 1.75]}
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      camera={{ position: [0, 56, 20], fov: 48, near: 0.1, far: 600 }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={["#030404"]} />
      {/* The map is a hundred units across, so the haze has to start past the
          far monuments or the place reads as one lit object in a black room. */}
      <fog attach="fog" args={["#030404", 78, 340]} />

      {/* Lights that carry the whole map, not just the middle of it. The two
          directionals have no falloff, so they are what actually models the
          monuments out on the ring; the point lights only warm head office. */}
      <ambientLight intensity={1.35} />
      <hemisphereLight args={["#7fe04a", "#061008", 0.7]} />
      <directionalLight position={[26, 34, 22]} intensity={3.1} color="#e8ffdd" />
      <directionalLight position={[-30, 16, -20]} intensity={1.8} color="#6fd42a" />
      <pointLight position={[0, 4, 0]} intensity={80} distance={52} color="#93F025" />
      <pointLight position={[0, 18, 6]} intensity={55} distance={60} color="#57B41A" />

      <Suspense fallback={null}>
        <World
          projects={projects}
          featuredId={featuredId}
          lite={lite}
          onSelect={onSelect}
          onHover={onHover}
        />
      </Suspense>

      <Cyberspace lite={lite} />
      <Ship />

      <CameraRig
        mode={mode}
        focusIndex={focusIndex}
        total={projects.length}
        progressRef={progressRef}
        pointing={Boolean(hoverId)}
        pickIndex={pickIndex}
        onFeature={onFeature}
        reduced={reduced}
      />
    </Canvas>
  );
}
