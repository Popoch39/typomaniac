import type { FaceOffOpening } from "@/components/face-off/face-off-timeline";
import type { SettingOption } from "@/components/settings/setting-group";

// Where the lab's Face-off opens from: the screen's edges (no card), or the box of each card
// « C'est parti ! » the Duel's bridge opens it from, as the app lays it out.
export type LabOpening = "edges" | "jouer" | "pill" | "challenge";

export const LAB_OPENING_OPTIONS: readonly SettingOption<LabOpening>[] = [
  { value: "edges", label: "Bords" },
  { value: "jouer", label: "Carte de Jouer" },
  { value: "pill", label: "Queue pill" },
  { value: "challenge", label: "Carte de Challenge" },
];

// The card's box on a screen of `width` × `height`: Jouer's card (620 px) in the middle of the
// page, right of the sidebar; the Queue pill (392 px) bottom right; a Challenge's card (320 px)
// top right.
export const labCard = (
  opening: LabOpening,
  width: number,
  height: number,
): FaceOffOpening["card"] | null => {
  switch (opening) {
    case "edges":
      return null;
    case "jouer":
      return { left: (width + 280 - 620) / 2, top: (height - 470) / 2, width: 620, height: 470 };
    case "pill":
      return { left: width - 24 - 392, top: height - 24 - 132, width: 392, height: 132 };
    case "challenge":
      return { left: width - 16 - 320, top: 64, width: 320, height: 66 };
  }
};
