import { recordSceneGhost, type SceneGhost } from "@/components/duel-scene/scene-ghost";

// The HUD's Score band as the Duel ended, for the Duel end's band to come from it: where it was on
// the screen (the Duel's scene scaled in), its size as laid out, its split (from the Lead, in % of
// its width), and a copy of what it showed over its two colours, to fade out.
export type BandMorph = SceneGhost & { split: number };

let recorded: BandMorph | null = null;

// The Duel end that came from it, the only one to read it: again, when StrictMode runs its effect
// twice.
let reader: Element | null = null;

// Records the HUD's band shown now (`data-duel-band`), if any, as the Duel ends: `split` is where
// its Lead put its slant. Its copy keeps the band's figures (disc, avatars, gauges, Scores),
// without its colours.
export const recordBandMorph = (split: number) => {
  const band = recordSceneGhost("[data-duel-band]", "data-band-ghost", "[data-band-fill]");

  reader = null;

  if (band === null) {
    recorded = null;

    return;
  }

  band.ghost.style.background = "none";
  recorded = { ...band, split };
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
