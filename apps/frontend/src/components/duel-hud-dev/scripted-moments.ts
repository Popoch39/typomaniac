// The moments of the board the dev page can freeze on, in ms since GO, to compare the HUD with it
// side by side.
export const SCRIPTED_MOMENTS = [
  { name: "mi-duel", at: 10_600 },
  { name: "burst", at: 12_250 },
  { name: "combo cassé", at: 14_000 },
  { name: "mené", at: 22_300 },
  { name: "dernières secondes", at: 27_800 },
  { name: "renversement", at: 29_400 },
  { name: "fin", at: 31_800 },
] as const;

// Played in a loop, the Duel starts over this long after GO, its end held a while.
export const SCRIPTED_LOOP_MS = 34_800;
