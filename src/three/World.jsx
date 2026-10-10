import Hq from "./Hq";
import Monument from "./Monument";
import { HQ_SCALE, RING, SHAPES, bearingOf } from "./layout";

/* =========================================================
   THE MAP
   ---------------------------------------------------------
   Head office in the middle, and the projects out on a ring
   around it as monuments you fly between — so the page reads
   as an open place with things standing in the distance,
   rather than one object you rotate.

   The ring is what the camera's heading is measured against:
   whichever monument you are pointing at is the live one, so
   flying round the map is the same gesture as choosing.
   ========================================================= */

export default function World({ projects, featuredId, lite, onSelect, onHover }) {
  return (
    <group>
      {/* Head office is a landmark now, seen from a ring road nineteen units
          out, so it is built at landmark size rather than desk size. */}
      <group scale={HQ_SCALE}>
        <Hq lite={lite} />
      </group>

      {projects.map((p, i) => {
        const a = bearingOf(i, projects.length);
        return (
          <Monument
            key={p.id}
            project={p}
            kind={SHAPES[i % SHAPES.length]}
            position={[Math.sin(a) * RING, 0, Math.cos(a) * RING]}
            /* each turns its face outward, towards the ring the camera flies,
               so arriving at one always arrives at a screen and not a flank */
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
