import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

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

/* Mounts only once everything inside the same Suspense boundary has its
   textures, and waits one more frame so the first picture is actually on
   the canvas before the loading screen is taken away. */
function Built({ onBuilt }) {
  const seen = useRef(false);
  useFrame(() => {
    if (seen.current) return;
    seen.current = true;
    onBuilt?.();
  });
  return null;
}

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
  onBuilt,
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
      camera={{ position: [0, 60, 30], fov: 55, near: 0.1, far: 700 }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={["#030404"]} />
      {/* The map is a hundred units across, so the haze has to start past the
          far monuments or the place reads as one lit object in a black room. */}
      <fog attach="fog" args={["#030404", 86, 380]} />

      {/* Lights that carry the whole map, not just the middle of it. The two
          directionals have no falloff, so they are what actually models the
          monuments out on the ring; the point lights only warm head office. */}
      <ambientLight intensity={1.8} />
      <hemisphereLight args={["#7fe04a", "#071209", 1.1]} />
      <directionalLight position={[26, 34, 22]} intensity={3.1} color="#e8ffdd" />
      <directionalLight position={[-30, 16, -20]} intensity={2.2} color="#6fd42a" />
      {/* no light at the centre of the map any more: there is nothing
          there to light. Head office carries its own. */}

      <Suspense fallback={null}>
        <Built onBuilt={onBuilt} />
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
