import { atHandle } from "@/lib/at-handle";

// Who leads the Duel, seen by this User: themself, their opponent, or no one at equal Scores.
export type Leader = "self" | "opponent" | "none";

export const leaderOf = (lead: number): Leader => {
  if (lead === 0) {
    return "none";
  }

  return lead > 0 ? "self" : "opponent";
};

// Where the split between the two colours of the band stands, in % of its width from the left:
// the middle at equal Scores, towards the led one's edge as the Lead grows, never reaching it.
export const bandSplit = (lead: number) => 50 + 44 * Math.tanh(lead / 60);

const points = (lead: number) => {
  const count = Math.abs(lead);

  return `${count} ${count === 1 ? "point" : "points"}`;
};

// What screen readers read of the band: who leads, and by how much.
export const bandLabel = (lead: number, opponentHandle: string) => {
  switch (leaderOf(lead)) {
    case "self":
      return `Tu mènes de ${points(lead)}`;
    case "opponent":
      return `${atHandle(opponentHandle)} mène de ${points(lead)}`;
    case "none":
      return "Même Score";
  }
};

// The Lead under the seconds of the disc: « +N » whoever leads, « = » at equal Scores.
export const discLead = (lead: number) => (lead === 0 ? "=" : `+${Math.abs(lead)}`);
