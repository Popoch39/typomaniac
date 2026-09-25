import type { Rank } from "ranked";

import type { SettingOption } from "@/components/settings/setting-group";
import type { DuelOpponent } from "@/stores/duel-store";

// The opponent the lab faces, with every rank the Face-off can show.
export const LAB_OPPONENT: DuelOpponent = { handle: "kzr_", image: null };

export type LabRank = "ranked" | "placement" | "challenge";

export const LAB_RANKS: Record<LabRank, Rank | null> = {
  ranked: { tier: "or", division: 2, tp: 42, shielded: false },
  placement: { placementsLeft: 3 },
  challenge: null,
};

export const LAB_RANK_OPTIONS: readonly SettingOption<LabRank>[] = [
  { value: "ranked", label: "Classé" },
  { value: "placement", label: "Placement" },
  { value: "challenge", label: "Challenge" },
];
