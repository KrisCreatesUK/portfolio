import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { cover, filmTexture } from "./textures";
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
     factory  ClippD       a line: long in one end, shorts out

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
  /* a board over the roof rather than a panel on the wall: three games
     at once need the width, and a casino would put it up there anyway */
  casino: { at: [0, 14.6, 1.84], size: [12.8, 7.2] },
  /* Out at the front on a board, the way a services tells you what is
     here before you have pulled in. Under the canopy it was a panel on a
     back wall that you only saw once you had arrived. */
  depot: { at: [-1.4, 8.6, 6.62], size: [11.5, 6.47] },
  /* Pokellectr is a phone, so the moving picture is on a phone: a display
     unit out on the forecourt at the height of the shop, running one of the
     cuts. The board over the roof carries the store listing instead, and the
     windows have the app in them — three things saying the same thing in the
     three ways anyone meets it. */
  shop: { at: [5.4, 6.9, 4.78], size: [3.9, 6.93] },
  /* The source, at the start of the line. ClippD was a cinema, which was
     the wrong idea twice over: a cinema is about watching something, and
     the facade carried nothing you could read going past. A line can be
     read in one look — the long thing goes in that end, the short ones
     come out the other. */
  factory: { at: [-3.5, 9.3, 1.35], size: [8.6, 4.84] },
};

/* and where the logo sign goes */
const SIGN = {
  /* which puts the name down on the canopy, where a marquee goes */
  casino: { at: [0, 4.4, 6.08], size: [7.4, 1.9] },
  depot: { at: [-6.6, 8.4, 0], size: [4.4, 2.8], turn: 0 },
  shop: { at: [0, 6.3, 2.3], size: [5, 1.6] },
  factory: { at: [-3.5, 13.1, 1.25], size: [5.6, 1.64] },
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
    return { v, t, src: project.clip, srcSm: project.clipSm ?? project.clip };
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

    /* One frontage plays: the one you are coming up on, and nothing is
       fetched until the first time you come up on it. A phone plays too,
       off a smaller cut of the same clip — one video at a time at two
       thirds the width is a cost a handset can carry, and the alternative
       was a street of frozen screens. */
    if (media) {
      const want = featured;
      const src = lite ? media.srcSm : media.src;
      if (want && media.v.getAttribute("src") !== src) {
        /* set through the attribute rather than the property: the compiler
           treats anything held in state as read-only, and this is a method */
        media.v.setAttribute("src", src);
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
        /* Hold the still until the video has actually painted a frame:
           readyState alone reports data is there before anything has been
           handed to the texture. */
        const painted = media.v.readyState >= 3 && media.v.currentTime > 0.08;
        const live = want && painted ? media.t : map;
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
      <mesh position={[0, 9, 1]} visible={false}>
        <boxGeometry args={[16, 24, 11]} />
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
      {kind === "factory" && <Factory accent={accent} project={project} />}

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
  const plugs = useTexture("/badges/for-wordpress.webp");

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

      {/* what it plugs into, over the door where you cannot miss it */}
      <mesh position={[0, 6.7, 3.24]}>
        <planeGeometry args={[6.9, 2.21]} />
        <meshBasicMaterial map={plugs} transparent toneMapped={false} />
      </mesh>

      {/* the doorway, glowing */}
      <mesh position={[0, 2, 3.24]}>
        <planeGeometry args={[4.4, 4]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} toneMapped={false} />
      </mesh>

      {/* bulbs along the facade, and up both sides of the board */}
      <Bulbs count={16} from={[-5.6, 5.1, 3.3]} to={[5.6, 5.1, 3.3]} colour={accent} />
      <Bulbs count={9} from={[-6.7, 11.4, 1.9]} to={[-6.7, 17.8, 1.9]} colour={accent} speed={1.1} />
      <Bulbs count={9} from={[6.7, 11.4, 1.9]} to={[6.7, 17.8, 1.9]} colour={accent} speed={1.1} />

      {/* the gantry the board is bolted to: a backing panel, a frame round
          it and two legs down onto the parapet */}
      <mesh position={[0, 14.6, 1.3]}>
        <boxGeometry args={[13.6, 8, 0.6]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 14.6, 1.62]}>
        <boxGeometry args={[13.2, 7.6, 0.1]} />
        <meshStandardMaterial color="#05090a" roughness={0.4} metalness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 6.5, 12.4, 1.1]}>
          <boxGeometry args={[0.5, 5.4, 0.5]} />
          <meshStandardMaterial {...pale} />
        </mesh>
      ))}

      {/* the board throws its own light down over the roof */}
      <pointLight position={[0, 13.5, 5]} color={accent} intensity={26} distance={24} />
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

      {/* The information board. Two posts, a deep frame and a header
          strip, out on the edge of the forecourt facing the traffic. */}
      <group position={[-1.4, 0, 6.1]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 4.4, 2.8, 0]} castShadow>
            <boxGeometry args={[0.7, 5.6, 0.7]} />
            <meshStandardMaterial {...pale} />
          </mesh>
        ))}
        <mesh position={[0, 8.6, 0]}>
          <boxGeometry args={[12.3, 7.3, 0.7]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        <mesh position={[0, 8.6, 0.33]}>
          <boxGeometry args={[11.9, 6.9, 0.1]} />
          <meshStandardMaterial color="#05090a" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* the header strip, lit */}
        <mesh position={[0, 12.5, 0.2]}>
          <boxGeometry args={[12.3, 0.8, 0.5]} />
          <meshStandardMaterial {...pale} />
        </mesh>
        <mesh position={[0, 12.5, 0.47]}>
          <planeGeometry args={[11.9, 0.52]} />
          <meshBasicMaterial color={accent} transparent opacity={0.75} toneMapped={false} />
        </mesh>
        <Bulbs
          count={12}
          from={[-5.5, 12.95, 0.3]}
          to={[5.5, 12.95, 0.3]}
          colour={accent}
          radius={0.08}
          speed={1.3}
        />
        <pointLight position={[0, 8.6, 5]} color={accent} intensity={24} distance={24} />
      </group>

      {/* The totem out by the road, as a lightbox: a lit panel behind the
          name with a frame round it and a lamp on it, the way a services
          sign is lit rather than merely being a sign in the dark. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[-6.6 + side * 1.5, 4.2, 0]}>
          <boxGeometry args={[0.4, 8.4, 0.4]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}
      <mesh position={[-6.6, 8.4, 0]}>
        <boxGeometry args={[5.4, 3.8, 0.7]} />
        <meshStandardMaterial {...pale} />
      </mesh>
      <mesh position={[-6.6, 8.4, 0.37]}>
        <planeGeometry args={[5.1, 3.5]} />
        <meshBasicMaterial color={accent} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh position={[-6.6, 8.4, -0.37]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[5.1, 3.5]} />
        <meshBasicMaterial color={accent} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <Bulbs
        count={9}
        from={[-9.2, 10.5, 0.1]}
        to={[-4, 10.5, 0.1]}
        colour={accent}
        radius={0.08}
        speed={1.2}
      />
      <pointLight position={[-6.6, 8.4, 3]} color={accent} intensity={22} distance={18} />

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
  const [store, win1, win2, play] = useTexture([
    "/shots/pokellectr-store.webp",
    "/shots/pokellectr-win1.webp",
    "/shots/pokellectr-win2.webp",
    "/badges/google-play.png",
  ]);

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

      {/* the window: lit, with the app itself standing up in it */}
      <mesh position={[0, 3.15, 2.72]}>
        <planeGeometry args={[5.4, 3.4]} />
        <meshBasicMaterial color={accent} transparent opacity={0.16} toneMapped={false} />
      </mesh>
      {[[-1.35, win1], [1.35, win2]].map(([x, tex], i) => (
        <group key={x} position={[x, 3.15, 2.76]} rotation={[0, 0, i ? -0.03 : 0.03]}>
          <mesh>
            <planeGeometry args={[1.5, 2.7]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
          <lineSegments position={[0, 0, 0.01]} raycast={() => null}>
            <edgesGeometry args={[new THREE.PlaneGeometry(1.5, 2.7)]} />
            <lineBasicMaterial color={accent} transparent opacity={0.6} />
          </lineSegments>
        </group>
      ))}
      <mesh position={[3.1, 1.6, 2.73]}>
        <planeGeometry args={[1.3, 3.1]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} />
      </mesh>

      {/* The display unit. Flat on purpose: a backing panel well behind the
          screen and a frame of four thin bars around it, rather than a solid
          body the screen has to sit proud of. An earlier version put the
          screen a fraction in front of a rounded box and it came out dead
          black every time. */}
      <group position={[5.4, 0, 4.4]}>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[1.6, 1.8, 0.28, 20]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.5, 3.2, 12]} />
          <meshStandardMaterial {...pale} />
        </mesh>
        <mesh position={[0, 6.9, 0]}>
          <planeGeometry args={[4.6, 7.7]} />
          <meshBasicMaterial color="#05090a" />
        </mesh>
        {[
          [0, 3.63, 4.6, 0.3],
          [0, 10.17, 4.6, 0.3],
          [-2.15, 6.9, 0.3, 7.1],
          [2.15, 6.9, 0.3, 7.1],
        ].map(([x, y, w, h]) => (
          <mesh key={`${x}:${y}`} position={[x, y, 0.38]}>
            <boxGeometry args={[w, h, 0.26]} />
            <meshStandardMaterial color="#1a2523" metalness={0.8} roughness={0.32} />
          </mesh>
        ))}
        <pointLight position={[0, 6.9, 4]} color={accent} intensity={20} distance={20} />
      </group>

      {/* where to get it. The badge is used exactly as Google supplies it,
          which is the only way it is allowed to be used. */}
      <mesh position={[-3.1, 1.5, 2.74]}>
        <planeGeometry args={[2.72, 1.05]} />
        <meshBasicMaterial map={play} transparent toneMapped={false} />
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

      {/* the board over the roof: a backing panel, a frame round it and two
          legs down onto the shop, with bulbs up either side */}
      <mesh position={[0, 11.6, 1.5]}>
        <boxGeometry args={[12.2, 7.2, 0.6]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 11.6, 1.82]}>
        <boxGeometry args={[11.8, 6.8, 0.1]} />
        <meshStandardMaterial color="#05090a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* the listing, as it appears on the store */}
      <mesh position={[0, 11.6, 1.9]}>
        <planeGeometry args={[11.2, 5.47]} />
        <meshBasicMaterial map={store} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 5.2, 7.4, 1.2]}>
          <boxGeometry args={[0.45, 4.2, 0.45]} />
          <meshStandardMaterial {...pale} />
        </mesh>
      ))}
      <Bulbs count={8} from={[-6.3, 8.7, 1.9]} to={[-6.3, 14.5, 1.9]} colour={accent} speed={1.1} />
      <Bulbs count={8} from={[6.3, 8.7, 1.9]} to={[6.3, 14.5, 1.9]} colour={accent} speed={1.1} />
      <pointLight position={[0, 10.6, 5]} color={accent} intensity={22} distance={22} />
    </group>
  );
}

/* =========================================================
   ClippD — a cinema
   A tall frontage, a marquee out over the pavement with two
   rows of bulbs, and a blade sign up the corner.
   ========================================================= */
/* A length of film running across the front of the building, and the two
   reels feeding it. Nothing here is a video: the strip is one tiled texture
   with its offset wound on every frame, which costs nothing and never has to
   wait for anything to load. */
function Film({ accent, y, z, width, height, speed = 0.16 }) {
  const tex = useMemo(() => {
    const t = filmTexture(accent);
    t.repeat.set(Math.max(2, Math.round(width / 2.4)), 1);
    return t;
  }, [accent, width]);

  useFrame((state) => {
    /* set through the method: the compiler treats a memoised value as
       read-only, and this is the one three gives you for it */
    tex.offset.setX((state.clock.elapsedTime * speed) % 1);
  });

  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <group position={[0, y, z]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <lineSegments position={[0, 0, 0.02]} raycast={() => null}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color={accent} transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

/* the reel it comes off, turning at the speed the film is moving */
function Reel({ accent, position, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * speed;
  });

  return (
    <group position={position} ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.42, 24]} />
        <meshStandardMaterial color="#1b2530" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.24]}>
        <torusGeometry args={[0.95, 0.07, 8, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.8} toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, 0.26]} rotation={[0, 0, (i / 3) * Math.PI * 2]}>
          <boxGeometry args={[1.6, 0.14, 0.06]} />
          <meshBasicMaterial color={accent} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.28]}>
        <circleGeometry args={[0.2, 14]} />
        <meshBasicMaterial color={accent} transparent opacity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* =========================================================
   ClippD — the line
   ---------------------------------------------------------
   A long low shed with a sawtooth roof. At one end the source
   goes in, on a screen the size of the wall. Along the front
   a belt runs, carrying it to the other end, where four
   vertical panels stand in a rack: the shorts that came out.
   A mast over the output end, flashing, because the last
   thing it does is publish them.

   Everything about it is meant to be read at the speed you
   go past: big screen one side, row of phone-shaped screens
   the other, something visibly moving between the two.
   ========================================================= */
function Factory({ accent, project }) {
  const outs = useTexture([
    "/shots/clippd-out1.webp",
    "/shots/clippd-out2.webp",
    "/shots/clippd-out3.webp",
    "/shots/clippd-out4.webp",
  ]);

  return (
    <group>
      {/* the shed */}
      <RoundedBox args={[16, 5.6, 7]} radius={0.1} smoothness={3} position={[0, 2.8, 0]} castShadow>
        <meshStandardMaterial {...stone} />
      </RoundedBox>

      {/* sawtooth roof: the one silhouette that says works rather than shop */}
      {[-6, -3, 0, 3, 6].map((x) => (
        <group key={x} position={[x, 5.6, 0]}>
          <mesh position={[0, 0.75, -0.6]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[1.5, 1.5, 7]} />
            <meshStandardMaterial {...pale} />
          </mesh>
          <mesh position={[0.52, 1.15, 1.5]} rotation={[0, 0, -0.78]}>
            <planeGeometry args={[1.5, 6.9]} />
            <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* the gantry the source screen hangs on */}
      <mesh position={[-3.5, 9.3, 1.05]}>
        <boxGeometry args={[9.4, 5.6, 0.5]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[-3.5 + side * 4.3, 7.4, 0.8]}>
          <boxGeometry args={[0.45, 4, 0.45]} />
          <meshStandardMaterial {...pale} />
        </mesh>
      ))}

      {/* IN and OUT, as a belt running the length of the front */}
      <Film accent={accent} y={6.5} z={3.62} width={15.4} height={1.25} speed={0.2} />

      {/* what comes off it: four shorts in a rack */}
      {outs.map((tex, i) => {
        const x = 2.1 + i * 1.95;
        return (
          <group key={x} position={[x, 2.9, 3.68]} rotation={[0, -0.12 * (i - 1.5), 0]}>
            <mesh position={[0, 0, -0.08]}>
              <boxGeometry args={[1.78, 3.2, 0.16]} />
              <meshStandardMaterial color="#12181d" metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh>
              <planeGeometry args={[1.6, 2.85]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
            <lineSegments position={[0, 0, 0.02]} raycast={() => null}>
              <edgesGeometry args={[new THREE.PlaneGeometry(1.6, 2.85)]} />
              <lineBasicMaterial color={accent} transparent opacity={0.75} />
            </lineSegments>
            <mesh position={[0, -1.76, 0]}>
              <boxGeometry args={[1.8, 0.14, 0.5]} />
              <meshStandardMaterial {...pale} />
            </mesh>
          </group>
        );
      })}

      {/* the mast over the output end, flashing: the last thing it does is
          put them out */}
      <mesh position={[8.4, 8, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 11, 8]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <Beacon accent={accent} position={[8.4, 13.7, 0]} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[8.4, 10.4 + i * 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7 - i * 0.16, 0.05, 6, 20]} />
          <meshBasicMaterial color={accent} transparent opacity={0.55} toneMapped={false} />
        </mesh>
      ))}

      {/* the doors */}
      <mesh position={[-3.5, 1.9, 3.53]}>
        <planeGeometry args={[5, 3.4]} />
        <meshBasicMaterial color={accent} transparent opacity={0.14} toneMapped={false} />
      </mesh>

      <pointLight position={[0, 7, 8]} color={accent} intensity={26} distance={28} />
      <group visible={false}>{project.id}</group>
    </group>
  );
}

/* a light on top of the mast, on the half-second */
function Beacon({ accent, position }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const p = (state.clock.elapsedTime * 0.8) % 1;
    ref.current.material.opacity = 0.2 + Math.pow(1 - p, 4) * 0.8;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.42, 12, 12]} />
      <meshBasicMaterial color={accent} transparent opacity={0.6} toneMapped={false} />
    </mesh>
  );
}

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

      {/* The film: a long run across the front, and a short one coming off
          it down the side — the long thing in, the short thing out, which is
          the whole of what the product does. */}
      <Film accent={accent} y={7.9} z={3.12} width={11.4} height={1.7} speed={0.14} />
      <Film accent={accent} y={10.4} z={3.12} width={7.6} height={1.15} speed={-0.26} />
      {/* the reels sit at the ends of the short run, feeding it */}
      <Reel accent={accent} position={[-4.6, 10.4, 3.1]} speed={0.8} />
      <Reel accent={accent} position={[4.6, 10.4, 3.1]} speed={-0.8} />

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
