import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";

import Rack from "./Rack";
import Panels from "./Panels";
import Cyberspace from "./Cyberspace";
import CameraRig from "./CameraRig";

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
  mode,
  progressRef,
  onSelect,
  onHover,
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
      camera={{ position: [-6.4, 4.8, 8.4], fov: 44, near: 0.1, far: 320 }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={["#030404"]} />
      <fog attach="fog" args={["#030404", 22, 125]} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 11, 7]} intensity={2.2} color="#e8ffdd" />
      <directionalLight position={[-9, 5, -6]} intensity={1.4} color="#6fd42a" />
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
          mode={mode}
          onSelect={onSelect}
          onHover={onHover}
        />
        <Panels projects={projects} activeId={activeId} hoverId={hoverId} mode={mode} />
      </Suspense>

      <Cyberspace lite={lite} />

      <CameraRig
        mode={mode}
        focusIndex={focusIndex}
        total={projects.length}
        progressRef={progressRef}
        pointing={Boolean(hoverId)}
        reduced={reduced}
      />
    </Canvas>
  );
}
