// The HUD's Score band as the Duel ended, for the Duel end's band to come from it: where it was on
// the screen (the Duel's scene scaled in), its size as laid out, its split (from the Lead, in % of
// its width), and a copy of what it showed over its two colours, to fade out.
export type BandMorph = {
  rect: DOMRect;
  width: number;
  height: number;
  split: number;
  ghost: HTMLElement;
};

// Over the Duel end, under the dialogs.
const GHOST_Z_INDEX = "40";

// The attributes that name what is in the band: a copy loses them, never taken for the original.
const MARKS = ["id", "role", "aria-label", "aria-labelledby", "aria-live", "data-duel-band"];

let recorded: BandMorph | null = null;

// The Duel end that came from it, the only one to read it: again, when StrictMode runs its effect
// twice.
let reader: Element | null = null;

// A copy of the band's figures (disc, avatars, gauges, Scores), without its colours, laid at the
// top left of the screen: its transform puts it where the band is.
const ghostOf = (band: HTMLElement) => {
  // SAFETY: a deep copy of an HTMLElement is an HTMLElement.
  const node = band.cloneNode(true) as HTMLElement;

  for (const marked of [node, ...node.querySelectorAll<HTMLElement>("*")]) {
    if (marked.hasAttribute("data-band-fill")) {
      marked.style.visibility = "hidden";
    }

    for (const mark of MARKS) {
      marked.removeAttribute(mark);
    }
  }

  node.setAttribute("aria-hidden", "true");
  node.setAttribute("data-band-ghost", "");
  node.inert = true;
  Object.assign(node.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${band.offsetWidth}px`,
    height: `${band.offsetHeight}px`,
    margin: "0",
    background: "none",
    transformOrigin: "0 0",
    zIndex: GHOST_Z_INDEX,
    pointerEvents: "none",
  });

  return node;
};

// Records the HUD's band shown now (`data-duel-band`), if any, as the Duel ends: `split` is where
// its Lead put its slant.
export const recordBandMorph = (split: number) => {
  const band = document.querySelector<HTMLElement>("[data-duel-band]");

  reader = null;
  recorded =
    band === null
      ? null
      : {
          rect: band.getBoundingClientRect(),
          width: band.offsetWidth,
          height: band.offsetHeight,
          split,
          ghost: ghostOf(band),
        };
};

// A new Duel's HUD: the last band, if no Duel end took it, leads to none.
export const forgetBandMorph = () => {
  recorded = null;
  reader = null;
};

// The band the Duel end in `screen` comes from: none if it already led to another.
export const bandMorphFor = (screen: Element) => {
  if (recorded === null) {
    return null;
  }

  reader ??= screen;

  return reader === screen ? recorded : null;
};
