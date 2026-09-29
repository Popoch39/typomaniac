import type { RunTone } from "@/components/run/run-tone";

// The colour of each player's caret, and of the initials it carries in the ink the Theme lays on
// it. In a Duel, the opponent's caret in the same Text: another colour, never mistaken for one's
// own. Shared by the Run's caret and the Duel's.
export const CARET_TONES: Record<RunTone, { caret: string; label: string }> = {
  own: { caret: "bg-caret", label: "bg-caret text-on-brand" },
  opponent: { caret: "bg-opponent-caret", label: "bg-opponent-caret text-on-opponent" },
};
