import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { cover } from "./textures";
import { isTap } from "./gesture";

/* =========================================================
   A VENUE
   ---------------------------------------------------------
   Each project gets a building of its own out on the map,
   and the building is the kind of place the product belongs
   in — so you know what it is from across the plain, before
   you can read a word on it.

     casino   CompKit      marquee, chaser bulbs, big board
     depot    Truck It     forecourt canopy, pumps, totem
     shop     Pokellectr   small card shop, awning, window
     cinema   ClippD       blade sign, marquee, poster wall

   What is shared: the forecourt they stand on, the ground
   ring that pulses when a venue is the live one, the lit
   sign carrying the product's own logo, the screen showing
   the product itself, and one invisible slab that takes the
   taps — the buildings have far too many small parts to be
   reliable click targets on a phone.
   ========================================================= */

/* Light enough to read as masonry at forty units. The near-black the tower
   is built from works for glass at the middle of the map, but out on the
   ring it just makes a building-shaped hole in the night. */
const stone = { color: "#1b2724", roughness: 0.62, metalness: 0.3 };
const dark = { color: "#101917", roughness: 0.68, metalness: 0.25 };
const pale = { color: "#2a3a36", roughness: 0.58, metalness: 0.32 };

export const VENUE_SCALE = 1.25;

/* where the product's screen hangs on each building, and how big */
const SCREEN = {
  casino: { at: [0, 7.4, 3.25], size: [7.4, 4.2] },
  depot: { at: [0, 5.1, -1.05], size: [6.4, 3.6] },
  shop: { at: [0, 3.15, 2.76], size: [4.6, 2.9] },
  cinema: { at: [0, 8.8, 3.08], size: [6.8, 4.3] },
};

/* and where the logo sign goes */
const SIGN = {
  casino: { at: [0, 12.4, 2.1], size: [6.6, 2.1] },
  depot: { at: [-6.6, 8.4, 0], size: [4.4, 2.8], turn: 0 },
  shop: { at: [0, 6.3, 2.3], size: [5, 1.6] },
  cinema: { at: [-4.3, 10.2, 2.85], size: [2.5, 6.4] },
};

/* =========================================================
   A ROW OF BULBS THAT CHASE
   One sphere per bulb with its own material, opacity driven
   in the frame loop. Cheap, and it is most of what makes a
   marquee read as a marquee.
   ========================================================= */
function Bulbs({ count, from, to, colour, radius = 0.09, speed = 1.6 }) {
  const mats = useRef([]);

  const points = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0 : i / (count - 1);
        return [
          from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t,
          from[2] + (to[2] - from[2]) * t,
        ];
      }),
    [count, from, to]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    mats.current.forEach((m, i) => {
      if (!m) return;
      const phase = ((t - i / count) % 1 + 1) % 1;
      m.opacity = 0.3 + Math.pow(1 - phase, 3) * 0.7;
    });
  });

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={p.join()} position={p} raycast={() => null}>
          <sphereGeometry args={[radius, 8, 8]} />
          <meshBasicMaterial
            ref={(m) => (mats.current[i] = m)}
            color={colour}
            transparent
            opacity={0.7}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* A lit panel carrying the product's own logo. Three layers: a dark backing
   so it reads as a physical sign, the mark itself, and an oversized copy
   blended additively standing in for bloom. */
function LogoSign({ src, accent, size, featured }) {
  const tex = useTexture(src);
  const glow = useRef();
  const [w, h] = size;

  const map = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [tex]);

  /* fit the mark inside the panel without stretching it */
  const [lw, lh] = useMemo(() => {
    const a = (tex.image?.width ?? 1) / (tex.image?.height ?? 1);
    const iw = w * 0.84;
    const ih = h * 0.74;
    return a > iw / ih ? [iw, iw / a] : [ih * a, ih];
  }, [tex, w, h]);

  useFrame((state) => {
    if (!glow.current) return;
    const t = state.clock.elapsedTime;
    const flicker = Math.sin(t * 2.2) * 0.06 + (Math.sin(t * 17) > 0.97 ? -0.22 : 0);
    glow.current.material.opacity = (featured ? 0.4 : 0.18) + flicker;
  });

  return (
    <group>
      <RoundedBox args={[w, h, 0.3]} radius={0.08} smoothness={3}>
        <meshStandardMaterial color="#050908" roughness={0.5} metalness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.17]} raycast={() => null}>
        <planeGeometry args={[lw, lh]} />
        <meshBasicMaterial map={map} transparent toneMapped={false} />
      </mesh>
      <mesh ref={glow} position={[0, 0, 0.16]} scale={1.08} raycast={() => null}>
        <planeGeometry args={[lw, lh]} />
        <meshBasicMaterial
          map={map}
          transparent
          opacity={0.3}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <lineSegments position={[0, 0, 0.16]} raycast={() => null}>
        <edgesGeometry args={[new THREE.PlaneGeometry(w, h)]} />
        <lineBasicMaterial color={accent} transparent opacity={featured ? 0.95 : 0.4} />
      </lineSegments>
    </group>
  );
}

/* =========================================================
   WHAT IS ON THE SCREEN
   ---------------------------------------------------------
   The product itself, running, in the device it runs on: a
   handset for the three apps and a monitor for the one that
   does not have one. They are the real marketing clips, cut
   short and small — the screen is a few metres wide at the
   far side of a street, so there is no point carrying more.

   Only the place you are level with plays. The rest hold a
   still of the same shot, which costs nothing and means four
   videos are never decoding at once. A phone gets the still
   throughout: the gain is small on a screen that size and
   the cost in battery is not.
   ========================================================= */
function useScreen(project, aspect) {
  const still = useTexture(project.poster ?? project.shot);

  const map = useMemo(() => {
    const t = still.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    return cover(t, aspect);
  }, [still, aspect]);

  /* Made once and never replaced, so nothing here ever sets state. Which
     texture is actually on the screen is decided frame by frame instead:
     the still until the video has frames to show, the video after that. */
  const [media] = useState(() => {
    if (!project.clip || typeof document === "undefined") return null;
    const v = document.createElement("video");
    v.loop = true;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.preload = "none";
    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.SRGBColorSpace;
    return { v, t, src: project.clip };
  });

  useEffect(() => {
    if (!media) return undefined;
    /* It has to be in the document: a detached element will not reliably
       start playing, and three only ever reads frames off it. */
    media.v.setAttribute(
      "style",
      "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none"
    );
    document.body.appendChild(media.v);
    return () => {
      media.v.remove();
      media.t.dispose();
      media.v.pause();
      media.v.removeAttribute("src");
      media.v.load();
    };
  }, [media]);

  return { map, media };
}

export default function Venue({ project, kind, position, facing, featured, onSelect, onHover, lite }) {
  const group = useRef();
  const screen = useRef();
  const ring = useRef();
  const halo = useRef();

  const accent = project.accent;
  const { at: screenAt, size: screenSize } = SCREEN[kind];
  const sign = SIGN[kind];
  const { map, media } = useScreen(project, screenSize[0] / screenSize[1]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    /* Only the frontage you are level with plays, and nothing is fetched
       until the first time one is. A phone never plays at all: the gain is
       small on a screen that size and the cost in battery is not. */
    if (media) {
      const want = featured && !lite;
      if (want && !media.v.getAttribute("src")) {
        /* set through the attribute rather than the property: the compiler
           treats anything held in state as read-only, and this is a method */
        media.v.setAttribute("src", media.src);
        media.v.load();
      }
      if (want && media.v.paused) {
        /* a refused autoplay is not worth shouting about — the still is
           already on the screen behind it */
        media.v.play().catch(() => {});
      } else if (!want && !media.v.paused) {
        media.v.pause();
      }
      if (screen.current) {
        const live = want && media.v.readyState >= 2 ? media.t : map;
        if (screen.current.material.map !== live) {
          screen.current.material.map = live;
          screen.current.material.needsUpdate = true;
        }
      }
    }

    if (screen.current) {
      screen.current.material.opacity = THREE.MathUtils.damp(
        screen.current.material.opacity,
        featured ? 1 : 0.45,
        4,
        dt
      );
    }
    if (ring.current) {
      const base = featured ? 1 : 0.55;
      const p = featured ? (t * 0.5) % 1 : 0;
      ring.current.scale.setScalar(base + p * 0.5);
      ring.current.material.opacity = (featured ? 0.45 : 0.14) * (1 - p * 0.8);
    }
    if (halo.current) {
      halo.current.material.opacity = THREE.MathUtils.damp(
        halo.current.material.opacity,
        featured ? 0.19 : 0.055,
        4,
        dt
      );
    }
    if (group.current) {
      const want = featured ? VENUE_SCALE : VENUE_SCALE * 0.97;
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, want, 4, dt));
    }
  });

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
      {/* one slab takes every tap, so no small part has to be hit */}
      <mesh position={[0, 6, 1]} visible={false}>
        <boxGeometry args={[15, 15, 11]} />
        <meshBasicMaterial />
      </mesh>

      {/* the forecourt it stands on */}
      <RoundedBox
        args={[15, 0.5, 12]}
        radius={0.1}
        smoothness={3}
        position={[0, 0.25, 0.8]}
        receiveShadow
      >
        <meshStandardMaterial {...dark} />
      </RoundedBox>

      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0.8]} raycast={() => null}>
        <ringGeometry args={[8.6, 9.1, 64]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.8]} raycast={() => null}>
        <circleGeometry args={[9.5, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {kind === "casino" && <Casino accent={accent} />}
      {kind === "depot" && <Depot accent={accent} />}
      {kind === "shop" && <Shop accent={accent} />}
      {kind === "cinema" && <Cinema accent={accent} />}

      {/* the product itself, up on the building's own screen */}
      <group position={screenAt}>
        <mesh ref={screen}>
          <planeGeometry args={screenSize} />
          <meshBasicMaterial map={map} toneMapped={false} transparent opacity={0.45} />
        </mesh>
        <lineSegments position={[0, 0, 0.02]} raycast={() => null}>
          <edgesGeometry args={[new THREE.PlaneGeometry(screenSize[0], screenSize[1])]} />
          <lineBasicMaterial color={accent} transparent opacity={featured ? 1 : 0.45} />
        </lineSegments>
      </group>

      <group position={sign.at} rotation={[0, sign.turn ?? 0, 0]}>
        <LogoSign src={project.logo} accent={accent} size={sign.size} featured={featured} />
      </group>

      <pointLight position={[0, 6, 7]} color={accent} intensity={featured ? 60 : 26} distance={46} />
    </group>
  );
}

/* =========================================================
   CompKit — a casino
   Low and wide, a stepped parapet, and a canopy over the
   door with bulbs running round it.
   ========================================================= */
function Casino({ accent }) {
  return (
    <group>
      <RoundedBox args={[12, 9, 6.4]} radius={0.12} smoothness={3} position={[0, 4.5, 0]} castShadow>
        <meshStandardMaterial {...stone} />
      </RoundedBox>

      {/* stepped parapet */}
      <mesh position={[0, 9.3, 0]}>
        <boxGeometry args={[12.6, 0.6, 7]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 10.1, 0]}>
        <boxGeometry args={[9, 1, 5.4]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 11.4, 0]}>
        <boxGeometry args={[5.2, 1.6, 3.4]} />
        <meshStandardMaterial {...pale} />
      </mesh>

      {/* The entrance canopy. A half-cylinder read as a tunnel aimed at the
          camera from every angle that mattered, so it is a flat slab with a
          lit lip — which is what a casino porte-cochere looks like anyway. */}
      <mesh position={[0, 4.3, 4.2]} castShadow>
        <boxGeometry args={[8.4, 0.5, 3.6]} />
        <meshStandardMaterial {...pale} />
      </mesh>
      <mesh position={[0, 3.98, 4.2]}>
        <boxGeometry args={[8.6, 0.16, 3.8]} />
        <meshBasicMaterial color={accent} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.8, 2.05, 5.5]} castShadow>
          <cylinderGeometry args={[0.28, 0.32, 4.1, 12]} />
          <meshStandardMaterial {...pale} />
        </mesh>
      ))}

      {/* the doorway, glowing */}
      <mesh position={[0, 2, 3.24]}>
        <planeGeometry args={[4.4, 4]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} toneMapped={false} />
      </mesh>

      {/* bulbs along the facade and up the sign tower */}
      <Bulbs count={16} from={[-5.6, 5.1, 3.3]} to={[5.6, 5.1, 3.3]} colour={accent} />
      <Bulbs count={8} from={[-3.2, 11, 2.2]} to={[-3.2, 13.6, 2.2]} colour={accent} speed={1.1} />
      <Bulbs count={8} from={[3.2, 11, 2.2]} to={[3.2, 13.6, 2.2]} colour={accent} speed={1.1} />

      {/* the mast the sign hangs on */}
      <mesh position={[0, 12.4, 1.8]}>
        <boxGeometry args={[7.2, 2.8, 0.3]} />
        <meshStandardMaterial {...dark} />
      </mesh>
    </group>
  );
}

/* =========================================================
   Truck It Lets Park — a services
   A canopy you could get an artic under, two pumps, a trailer
   parked up and a totem out by the road.
   ========================================================= */
function Depot({ accent }) {
  return (
    <group>
      {/* the shop behind */}
      <RoundedBox args={[9, 5, 4.6]} radius={0.1} smoothness={3} position={[0, 2.5, -3.4]} castShadow>
        <meshStandardMaterial {...stone} />
      </RoundedBox>

      {/* the canopy */}
      <mesh position={[0, 6.6, 0.4]} castShadow>
        <boxGeometry args={[13, 0.7, 9]} />
        <meshStandardMaterial {...pale} />
      </mesh>
      <mesh position={[0, 6.18, 0.4]}>
        <boxGeometry args={[13.2, 0.14, 9.2]} />
        <meshBasicMaterial color={accent} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      {[
        [-5.4, 3.6],
        [5.4, 3.6],
        [-5.4, -2.6],
        [5.4, -2.6],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 3.2, z]} castShadow>
          <boxGeometry args={[0.55, 6.4, 0.55]} />
          <meshStandardMaterial {...pale} />
        </mesh>
      ))}

      {/* two pumps */}
      {[-2.4, 2.4].map((x) => (
        <group key={x} position={[x, 0.5, 1.8]}>
          <RoundedBox args={[1.1, 2.4, 0.9]} radius={0.08} smoothness={3} position={[0, 1.2, 0]}>
            <meshStandardMaterial {...stone} />
          </RoundedBox>
          <mesh position={[0, 1.7, 0.47]}>
            <planeGeometry args={[0.7, 0.5]} />
            <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* a trailer parked up on the right */}
      <group position={[9.2, 0.5, 2.4]} rotation={[0, -0.35, 0]}>
        <RoundedBox args={[3.1, 3.1, 8.4]} radius={0.1} smoothness={3} position={[0, 2.5, 0]} castShadow>
          <meshStandardMaterial {...pale} />
        </RoundedBox>
        <mesh position={[0, 2.5, 4.22]}>
          <planeGeometry args={[2.5, 2.4]} />
          <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} />
        </mesh>
        {[-2.6, 0.2, 2.9].map((z) =>
          [-1, 1].map((s) => (
            <mesh key={`${z}:${s}`} position={[s * 1.6, 0.6, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.55, 0.55, 0.3, 12]} />
              <meshStandardMaterial {...dark} />
            </mesh>
          ))
        )}
      </group>

      {/* the totem out by the road */}
      <mesh position={[-6.6, 4.2, 0]}>
        <boxGeometry args={[0.45, 8.4, 0.45]} />
        <meshStandardMaterial {...dark} />
      </mesh>

      {/* a lit edge along the forecourt, like a kerb */}
      <Bulbs
        count={10}
        from={[-6.3, 0.6, 6.2]}
        to={[6.3, 0.6, 6.2]}
        colour={accent}
        radius={0.07}
        speed={0.9}
      />
    </group>
  );
}

/* =========================================================
   Pokellectr — a card shop
   A small unit with a gable, a striped awning and a window
   you can see the stock through.
   ========================================================= */
function Shop({ accent }) {
  return (
    <group>
      <RoundedBox args={[8, 5, 5.4]} radius={0.1} smoothness={3} position={[0, 2.8, 0]} castShadow>
        <meshStandardMaterial {...stone} />
      </RoundedBox>

      {/* the gable */}
      <mesh position={[0, 6.3, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[5.9, 2.4, 4]} />
        <meshStandardMaterial {...pale} />
      </mesh>

      {/* the awning over the window */}
      <mesh position={[0, 4.8, 3.3]} rotation={[-0.42, 0, 0]}>
        <boxGeometry args={[7.6, 0.14, 2.4]} />
        <meshStandardMaterial color="#1b1410" roughness={0.7} metalness={0.2} />
      </mesh>
      {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((x) => (
        <mesh key={x} position={[x, 4.78, 3.32]} rotation={[-0.42, 0, 0]}>
          <boxGeometry args={[0.55, 0.17, 2.42]} />
          <meshBasicMaterial color={accent} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}

      {/* the window, and a lit door beside it */}
      <mesh position={[0, 3.15, 2.72]}>
        <planeGeometry args={[5.4, 3.4]} />
        <meshBasicMaterial color="#0a0f0d" />
      </mesh>
      <mesh position={[3.1, 1.6, 2.73]}>
        <planeGeometry args={[1.3, 3.1]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} />
      </mesh>

      {/* a sandwich board out on the pavement */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-4.6, 1, 4.6]} rotation={[0, 0.5, s * 0.16]}>
          <boxGeometry args={[1.5, 1.9, 0.08]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}

      <Bulbs
        count={11}
        from={[-3.5, 5.45, 3.1]}
        to={[3.5, 5.45, 3.1]}
        colour={accent}
        radius={0.07}
        speed={1.2}
      />
    </group>
  );
}

/* =========================================================
   ClippD — a cinema
   A tall frontage, a marquee out over the pavement with two
   rows of bulbs, and a blade sign up the corner.
   ========================================================= */
function Cinema({ accent }) {
  return (
    <group>
      <RoundedBox args={[11, 12, 6]} radius={0.12} smoothness={3} position={[0, 6, 0]} castShadow>
        <meshStandardMaterial {...stone} />
      </RoundedBox>

      {/* the marquee */}
      <mesh position={[0, 5.4, 4]} castShadow>
        <boxGeometry args={[11.6, 1.5, 3.4]} />
        <meshStandardMaterial {...pale} />
      </mesh>
      <mesh position={[0, 4.6, 4]}>
        <boxGeometry args={[11.8, 0.18, 3.6]} />
        <meshBasicMaterial color={accent} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <Bulbs count={15} from={[-5.5, 6.25, 5.6]} to={[5.5, 6.25, 5.6]} colour={accent} radius={0.1} />
      <Bulbs
        count={15}
        from={[-5.5, 4.55, 5.6]}
        to={[5.5, 4.55, 5.6]}
        colour={accent}
        radius={0.1}
        speed={-1.6}
      />

      {/* doors under it */}
      <mesh position={[0, 2, 3.03]}>
        <planeGeometry args={[6, 3.8]} />
        <meshBasicMaterial color={accent} transparent opacity={0.16} toneMapped={false} />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 2, 3.08]}>
          <boxGeometry args={[0.12, 3.8, 0.06]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}

      {/* poster boards either side of the doors */}
      {[-4.2, 4.2].map((x) => (
        <mesh key={x} position={[x, 2.4, 3.04]}>
          <planeGeometry args={[1.8, 2.8]} />
          <meshBasicMaterial color="#0c0f12" />
        </mesh>
      ))}

      {/* the blade, up the left corner */}
      <mesh position={[-4.3, 10.2, 2.55]}>
        <boxGeometry args={[2.9, 7.2, 0.4]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[-4.3, 14.3, 2.7]}>
        <cylinderGeometry args={[0.07, 0.07, 1.6, 8]} />
        <meshStandardMaterial {...dark} />
      </mesh>
    </group>
  );
}
