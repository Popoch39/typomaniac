import type { Rank, Stake } from "ranked";

import { signedTp } from "@/components/tier/rank/rank-label";

type FaceOffStakeProps = { rank: Rank | null; stake: Stake | null };

// This User's Stake in the Face-off, under their rank and Form: the TP a win and a loss would
// move, exactly what the Duel applies, in ink on their colour. Only the TP: never the rank they
// lead to. Nothing for a Challenge or in Placement: no TP moves.
export const FaceOffStake = ({ rank, stake }: FaceOffStakeProps) => {
  if (stake === null || rank === null || "placementsLeft" in rank) {
    return null;
  }

  // The signs tell the two apart on screen; screen readers get their names.
  return (
    <section
      aria-label="Enjeu"
      className="flex gap-5 font-mono text-lg font-semibold tabular-nums opacity-80"
    >
      <p>
        <span className="sr-only">Victoire </span>
        {signedTp(stake.win.tp)}
      </p>{" "}
      <p>
        <span className="sr-only">Défaite </span>
        {signedTp(stake.loss.tp)}
      </p>
    </section>
  );
};
