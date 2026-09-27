// The studs of an engraving (its circles), each scaled about its own centre by `--pop`, as the
// canvas's `transform-box: fill-box` does: GSAP moves the variable, never an SVG transform.
export const POPPED_STUDS =
  "[&>circle]:origin-center [&>circle]:[transform-box:fill-box] [&>circle]:[transform:scale(var(--pop,1))]";

// Each ring around a stud or a gem scaled about its own centre by `--ping`, the same way: small and
// lit until it flies off, as in the canvas.
export const PINGED =
  "[&>circle]:origin-center [&>circle]:[transform-box:fill-box] [&>circle]:[transform:scale(var(--ping,1))]";

// A piece scaled about its own centre by `--pop`, the same way.
export const POPPED = "origin-center [transform-box:fill-box] [transform:scale(var(--pop,1))]";

// The glint of an engraving (its group), scaled about its own centre by `--pop` and turned by
// `--spin` (deg) as it twinkles, the same way.
export const GLINTED =
  "[&>g]:origin-center [&>g]:[transform-box:fill-box] [&>g]:[transform:scale(var(--pop,1))_rotate(calc(var(--spin,0)*1deg))]";
