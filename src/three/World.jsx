import Hq from "./Hq";
import Venue from "./Venue";
import Streets from "./Streets";
import { RING, bearingOf } from "./layout";
import { HQ_SCALE } from "./layout";

/* =========================================================
   THE MAP
   ---------------------------------------------------------
   Head office in the middle, with a storey per project and
   the product showing in the windows, and out on a ring
   around it the place each product belongs in: a casino, a
   services, a card shop, a cinema.

   Both are ways in. Press a window and you are flown out to
   that venue; fly to the venue yourself and you get there
   the same way. The ring is what the camera's heading is
   measured against, so flying round the map and choosing
   are one gesture.
   ========================================================= */

export default function World({ projects, featuredId, lite, onSelect, onHover }) {
  return (
    <group>
      <Streets />

      <group scale={HQ_SCALE}>
        <Hq
          lite={lite}
          projects={projects}
          featuredId={featuredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      </group>

      {projects.map((p, i) => {
        const a = bearingOf(i, projects.length);
        return (
          <Venue
            key={p.id}
            project={p}
            kind={p.venue}
            position={[Math.sin(a) * RING, 0, Math.cos(a) * RING]}
            /* each faces outward, towards the ring the camera flies, so
               arriving at one arrives at a frontage and not a back wall */
            facing={a}
            featured={p.id === featuredId}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
    </group>
  );
}
