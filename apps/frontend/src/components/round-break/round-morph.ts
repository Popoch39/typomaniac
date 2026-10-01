import { recordSceneGhost, type SceneGhost } from "@/components/duel-scene/scene-ghost";

// The scene between a Round and its Round break, as it stood when it changed: what slides into
// the new one (the HUD's band into the Round break's header, and back), and what leaves (the Text,
// then the next Round's card), as copies to fade out.
export type RoundMorph = { from: SceneGhost; leaving: SceneGhost | null };

// The way it goes: into the Round break, or out of it into the next Round.
type Way = "into-break" | "into-round";

const recorded: Record<Way, RoundMorph | null> = { "into-break": null, "into-round": null };

// The screen that read each, the only one to: again when StrictMode runs its effect twice.
const readers: Record<Way, Element | null> = { "into-break": null, "into-round": null };

const record = (way: Way, from: SceneGhost | null, leaving: SceneGhost | null) => {
  readers[way] = null;
  recorded[way] = from === null ? null : { from, leaving };
};

// A Round over without deciding the Duel: its HUD's band (into the header) and its Text's card
// (leaving), as they stand.
export const recordIntoBreak = () =>
  record(
    "into-break",
    recordSceneGhost("[data-duel-band]", "data-round-ghost"),
    recordSceneGhost("[data-duel-text-card]", "data-round-ghost"),
  );

// The GO of the next Round: the Round break's header (into the band) and the next Round's card
// (leaving), as they stand.
export const recordIntoRound = () =>
  record(
    "into-round",
    recordSceneGhost("[data-round-head]", "data-round-ghost"),
    recordSceneGhost('[data-rb="next"]', "data-round-ghost"),
  );

// What the scene in `screen` comes out of, going `way`: none if another screen took it, or if it
// came some other way (joined after a reload).
export const roundMorphFor = (way: Way, screen: Element) => {
  if (recorded[way] === null) {
    return null;
  }

  readers[way] ??= screen;

  return readers[way] === screen ? recorded[way] : null;
};

// A Duel left, or a new one: nothing recorded leads anywhere.
export const forgetRoundMorphs = () => {
  record("into-break", null, null);
  record("into-round", null, null);
};
