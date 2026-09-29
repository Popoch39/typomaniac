import type { ReplayedDuel, ReplayedPlayer } from "@/api/duel-history";
import { duelNumber } from "@/components/duel-history/duel-number";

// A line of the Results table: what it measures, the User's value, then the opponent's (null once
// their User is deleted), as they read.
export type DuelResultLine = { name: string; own: string; opponent: string | null };

const percent = (value: number) => `${duelNumber(value)} %`;

// What a line reads of a player, in the table's order.
const MEASURES: { name: string; of: (player: ReplayedPlayer) => string }[] = [
  { name: "Score", of: ({ score }) => duelNumber(score?.score ?? null) },
  { name: "wpm", of: ({ result }) => duelNumber(result.wpm) },
  { name: "raw", of: ({ result }) => duelNumber(result.raw) },
  { name: "précision", of: ({ result }) => percent(result.accuracy) },
  { name: "régularité", of: ({ result }) => percent(result.consistency) },
  // Null for a Duel played before the Score, like the Score itself.
  { name: "meilleur Combo", of: ({ score }) => duelNumber(score?.bestCombo ?? null) },
  { name: "Bursts", of: ({ score }) => duelNumber(score?.bursts ?? null) },
];

// What each line measures, in the table's order: the skeleton draws one line per name.
export const DUEL_RESULT_NAMES = MEASURES.map(({ name }) => name);

// The seven lines comparing both sides of a finished Duel.
export const duelResultLines = ({ me, opponent }: ReplayedDuel): DuelResultLine[] =>
  MEASURES.map(({ name, of }) => ({
    name,
    own: of(me),
    opponent: opponent === null ? null : of(opponent),
  }));
