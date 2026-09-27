// The studs of an engraving (its circles), each scaled about its own centre by `--pop`, as the
// canvas's `transform-box: fill-box` does: GSAP moves the variable, never an SVG transform.
export const POPPED_STUDS =
  "[&>circle]:origin-center [&>circle]:[transform-box:fill-box] [&>circle]:[transform:scale(var(--pop,1))]";
