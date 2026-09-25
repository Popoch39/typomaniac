import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import type { SettingOption } from "@/components/settings/setting-group";
import type { DuelOpponent } from "@/stores/duel-store";

// The opponent the lab faces, with every rank and Form the Face-off can show.
export const LAB_OPPONENT: DuelOpponent = { handle: "kzr_", image: null };

export type LabPairing = "ranked" | "placement" | "challenge";

export const LAB_PAIRINGS: Record<LabPairing, FaceOffPairing> = {
  ranked: {
    selfRank: { tier: "platine", division: 4, tp: 12, shielded: false },
    opponentRank: { tier: "or", division: 2, tp: 42, shielded: false },
    selfForm: { avgWpm: 84.2, outcomes: ["win", "win", "loss", "win", "draw"] },
    opponentForm: { avgWpm: 91.6, outcomes: ["loss", "win", "win", "loss", "win"] },
  },
  // This User without a Ranked Duel yet: their Form is absent.
  placement: {
    selfRank: { placementsLeft: 5 },
    opponentRank: { placementsLeft: 3 },
    selfForm: null,
    opponentForm: { avgWpm: 63, outcomes: ["win", "loss"] },
  },
  challenge: {
    selfRank: null,
    opponentRank: null,
    selfForm: { avgWpm: 84.2, outcomes: ["win", "win", "loss", "win", "draw"] },
    opponentForm: { avgWpm: 91.6, outcomes: ["loss", "win", "win", "loss", "win"] },
  },
};

export const LAB_PAIRING_OPTIONS: readonly SettingOption<LabPairing>[] = [
  { value: "ranked", label: "Classé" },
  { value: "placement", label: "Placement" },
  { value: "challenge", label: "Challenge" },
];
