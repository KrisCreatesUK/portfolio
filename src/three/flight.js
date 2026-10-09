/* =========================================================
   WHERE THE CAMERA IS, SHARED
   ---------------------------------------------------------
   The camera rig keeps its state in a ref so that flying
   never causes a React render. The ship has to sit in front
   of that camera and bank into its turns, which means it
   needs the same numbers every frame.

   So the rig publishes them here and the ship reads them.
   A plain mutable object on purpose: written and read inside
   frame loops, never during a render.
   ========================================================= */

export const flight = {
  az: -0.62,       // where round the building we are
  height: 0,       // how far up
  rad: 13,         // how far out
  vAz: 0,          // turn rate, for banking
  vHeight: 0,      // climb rate, for pitch
  flying: false,   // false during the arrival and inside a write-up
};
