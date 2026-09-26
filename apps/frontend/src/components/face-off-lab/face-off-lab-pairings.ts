import type { Form } from "api";

import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import type { SettingOption } from "@/components/settings/setting-group";
import type { DuelOpponent } from "@/stores/duel-store";

// The opponent the lab faces, with every rank, Form and Stake the Face-off can show.
export const LAB_OPPONENT: DuelOpponent = { handle: "kzr_", image: null };

export type LabPairing =
  | "ranked"
  | "division"
  | "promotion"
  | "forManiac"
  | "demotion"
  | "shielded"
  | "ferIv"
  | "maniac"
  | "placement"
  | "challenge";

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
  // A Promotion Duel: a win moves this User up a Tier, from Or I to Platine IV.
  promotion: {
    selfRank: { tier: "or", division: 1, tp: 91, shielded: false },
    opponentRank: { tier: "platine", division: 4, tp: 30, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 14, standing: { tier: "platine", division: 4, tp: 5, shielded: true } },
      loss: { tp: -11, standing: { tier: "or", division: 1, tp: 80, shielded: false } },
    },
  },
  // A Promotion Duel for Maniac: a win moves this User from Diamant I into Maniac.
  forManiac: {
    selfRank: { tier: "diamant", division: 1, tp: 95, shielded: false },
    opponentRank: { tier: "maniac", tp: 212, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 9, standing: { tier: "maniac", tp: 4, shielded: true } },
      loss: { tp: -16, standing: { tier: "diamant", division: 1, tp: 79, shielded: false } },
    },
  },
  // A loss moves this User down a Division.
  demotion: {
    selfRank: { tier: "or", division: 2, tp: 8, shielded: false },
    opponentRank: { tier: "or", division: 2, tp: 47, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 12, standing: { tier: "or", division: 2, tp: 20, shielded: false } },
      loss: { tp: -12, standing: { tier: "or", division: 3, tp: 75, shielded: false } },
    },
  },
  // Just moved up: the shield holds a loss below 0 TP in the Division.
  shielded: {
    selfRank: { tier: "or", division: 2, tp: 4, shielded: true },
    opponentRank: { tier: "or", division: 2, tp: 47, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 12, standing: { tier: "or", division: 2, tp: 16, shielded: true } },
      loss: { tp: -12, standing: { tier: "or", division: 2, tp: 0, shielded: false } },
    },
  },
  // The lowest rank: a loss below 0 TP stays at 0.
  ferIv: {
    selfRank: { tier: "fer", division: 4, tp: 6, shielded: false },
    opponentRank: { tier: "fer", division: 3, tp: 30, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 14, standing: { tier: "fer", division: 4, tp: 20, shielded: false } },
      loss: { tp: -12, standing: { tier: "fer", division: 4, tp: 0, shielded: false } },
    },
  },
  // TP without a cap: no bar.
  maniac: {
    selfRank: { tier: "maniac", tp: 248, shielded: false },
    opponentRank: { tier: "maniac", tp: 310, shielded: false },
    selfForm,
    opponentForm,
    selfStake: {
      win: { tp: 11, standing: { tier: "maniac", tp: 259, shielded: false } },
      loss: { tp: -11, standing: { tier: "maniac", tp: 237, shielded: false } },
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
  { value: "promotion", label: "Duel de promotion" },
  { value: "forManiac", label: "Duel pour Maniac" },
  { value: "demotion", label: "Descente" },
  { value: "shielded", label: "Protégé" },
  { value: "ferIv", label: "Fer IV" },
  { value: "maniac", label: "Maniac" },
  { value: "placement", label: "Placement" },
  { value: "challenge", label: "Challenge" },
];
