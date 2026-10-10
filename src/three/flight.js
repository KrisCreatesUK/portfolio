/* =========================================================
   WHERE ON THE ROAD WE ARE, SHARED
   ---------------------------------------------------------
   The camera rig keeps its state in a ref so that flying
   never causes a React render. The craft has to fly the same
   road a little way ahead of it, which means it needs the
   same numbers every frame.

   So the rig publishes them here and the craft reads them.
   A plain mutable object on purpose: written and read inside
   frame loops, never during a render.
   ========================================================= */

/* What the on-screen arrows are asking for, -1 to 1 on each axis.
   climb is forward and back up the street; turn is looking across it.
   The HUD writes it while a key or a button is held; the rig reads it. */
export const input = { turn: 0, climb: 0 };

export const flight = {
  /* the arrival: 0 to 1 while the craft is flying itself in, null after.
     While it is running the rig drives the craft and publishes where it
     put it, because the camera is chasing it and the two cannot disagree. */
  intro: 0,
  sx: 0,
  sy: 0,
  sz: 0,
  syaw: 0,
  sbank: 0,
  s: 0,            // how far along the road
  speed: 0,        // and how fast, for the craft's engines
  eye: 9.5,        // how high the camera is riding
  flying: false,   // false during the arrival and inside a write-up
};
