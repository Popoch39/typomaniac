import type { DuelSide } from "@/components/replay/replay-sides";

// Each side of the Duel chart in its caret color.
export const DUEL_CHART_COLORS: Record<DuelSide, string> = {
  own: "var(--caret)",
  opponent: "var(--opponent-caret)",
};
