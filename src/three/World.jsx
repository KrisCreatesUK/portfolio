import Hq from "./Hq";
import Venue from "./Venue";
import Streets from "./Streets";
import { HQ_FACING, HQ_SCALE, hqAt, venueAt, venueFacing } from "./layout";

/* =========================================================
   THE MAP
   ---------------------------------------------------------
   Head office in the middle of the block, with a storey per
   project and the product showing in the windows, and the
   street running round it with the place each product
   belongs in built along it: a casino, a services, a card
   shop, a cinema — alternating sides of the road.

   Both are ways in. Press a window and you are driven up the
   street to that frontage; fly up there yourself and you
   arrive at the same place.
   ========================================================= */

export default function World({ projects, featuredId, lite, onSelect, onHover }) {
  return (
    <group>
      <Streets />

      {/* on its own plot now rather than in the middle of the block, so
          the tour drives past it like everything else */}
      <group position={hqAt()} rotation={[0, HQ_FACING, 0]} scale={HQ_SCALE}>
        <Hq
          lite={lite}
          projects={projects}
          featuredId={featuredId}
          onSelect={onSelect}
          onHover={onHover}
        />
        {/* the light that used to sit at the centre of the map travels with
            the building, because the building is what it was ever for */}
        <pointLight position={[0, 4, 0]} intensity={70} distance={42} color="#93F025" />
        <pointLight position={[0, 15, 5]} intensity={48} distance={48} color="#57B41A" />
      </group>

      {projects.map((p, i) => (
        <Venue
          key={p.id}
          project={p}
          kind={p.venue}
          lite={lite}
          position={venueAt(i, projects.length)}
          /* turned to face the traffic going past, so you arrive at a
             frontage and never at the back of the building */
          facing={venueFacing(i)}
          featured={p.id === featuredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}
