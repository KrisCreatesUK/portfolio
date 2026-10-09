/* =========================================================
   ONE SHARED FACT: was that a tap, or a flight?
   ---------------------------------------------------------
   react-three-fiber fires a click on pointerup over whatever
   object the pointer is over, however far it travelled in
   between. On a page whose whole interaction is dragging a
   camera around a building, that means every attempt to fly
   opens whichever project you happened to drag across.

   The camera rig already follows the pointer, so it records
   the distance here and the tower checks it before treating
   a click as a choice. A plain module rather than context or
   state: it is read inside a pointer handler, never during a
   render, and it must not cause one.
   ========================================================= */

export const gesture = {
  /* pixels travelled since the pointer went down */
  moved: 0,
};

/* Far enough that it was meant as a drag. Generous, because a finger on
   glass never holds perfectly still. */
export const TAP_SLOP = 10;

export const isTap = () => gesture.moved <= TAP_SLOP;
