import type { Form } from "api";

import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import type { SettingOption } from "@/components/settings/setting-group";
import type { DuelOpponent } from "@/stores/duel-store";

// The opponent the lab faces, with every rank, Form and Stake the Face-off can show.
export const LAB_OPPONENT: DuelOpponent = { handle: "kzr_", image: null };

export type LabPairing = "ranked" | "division" | "placement" | "challenge";

const selfForm: Form = { avgWpm: 84.2, outcomes: ["win", "win", "loss", "win", "draw"] };

const opponentForm: Form = { avgWpm: 91.6, outcomes: ["loss", "win", "win", "loss", "win"] };

export const LAB_PAIRINGS: Record<LabPairing, FaceOffPairing> = {
  // An ordinary ranked Duel: a win keeps the Division.
  ranked: {
    selfRank: { tier: "platine", division: 4, tp: 12, shielded: false },
    opponentRank: { tier: "or", division: 2, tp: 42, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 14, standing: { tier: "platine", division: 4, tp: 26, shielded: false } },
      loss: { tp: -11, standing: { tier: "platine", division: 4, tp: 1, shielded: false } },
    },
  },
  // A win moves this User up a Division.
  division: {
    selfRank: { tier: "or", division: 3, tp: 94, shielded: false },
    opponentRank: { tier: "or", division: 2, tp: 47, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 12, standing: { tier: "or", division: 2, tp: 6, shielded: true } },
      loss: { tp: -13, standing: { tier: "or", division: 3, tp: 81, shielded: false } },
    },
  },
  // This User without a Ranked Duel yet: their Form is absent, and no TP at stake.
  placement: {
    selfRank: { placementsLeft: 5 },
    opponentRank: { placementsLeft: 3 },
    selfForm: null,
    opponentForm: { avgWpm: 63, outcomes: ["win", "loss"] },
    selfStake: null,
  },
  challenge: {
    selfRank: null,
    opponentRank: null,
    selfForm,
    opponentForm,
    selfStake: null,
  },
};

export const LAB_PAIRING_OPTIONS: readonly SettingOption<LabPairing>[] = [
  { value: "ranked", label: "Classé" },
  { value: "division", label: "Montée de Division" },
  { value: "placement", label: "Placement" },
  { value: "challenge", label: "Challenge" },
];
