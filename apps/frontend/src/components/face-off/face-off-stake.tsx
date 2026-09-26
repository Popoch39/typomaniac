import { cn } from "cn";
import { DIVISION_TP, type Rank, type Stake } from "ranked";

import { FaceOffStakeBar } from "@/components/face-off/face-off-stake-bar";
import { FaceOffStakeHeader } from "@/components/face-off/face-off-stake-header";
import { FaceOffStakeOutcome } from "@/components/face-off/face-off-stake-outcome";
import { stakeCopy } from "@/components/face-off/stake-copy";
import { TIER_COLORS } from "@/components/tier/tier";

type FaceOffStakeProps = { rank: Rank | null; stake: Stake | null };

// This User's Stake in the Face-off, under their rank and Form: what a win and a loss would do to
// their TP, exactly what the Duel applies. Bordered in the colour of the rank a win moves up to.
// Nothing for a Challenge or in Placement: no TP moves.
export const FaceOffStake = ({ rank, stake }: FaceOffStakeProps) => {
  if (stake === null || rank === null || "placementsLeft" in rank) {
    return null;
  }

  const { promotion, win, loss } = stakeCopy(rank, stake);

  // The card's colour, which the hatches and the rank moved up to take: the Tier aimed at, or
  // this User's. Each text sets its own.
  return (
    <section
      aria-label="Enjeu"
      className={cn(
        "flex w-120 flex-col gap-3 rounded-[1.375rem] bg-background px-5 py-4.5 ring-2",
        TIER_COLORS[(promotion ?? rank).tier],
        promotion === null ? "ring-foreground/10" : "ring-current",
      )}
    >
      <FaceOffStakeHeader promotion={promotion} />
      {rank.tier === "maniac" ? null : (
        <FaceOffStakeBar
          standing={rank}
          reached={promotion === null ? stake.win.standing.tp : DIVISION_TP}
        />
      )}
      <p className="flex items-center justify-between text-sm text-muted-foreground">
        {rank.tier === "maniac" ? null : (
          <span className="font-mono text-[0.8125rem] tabular-nums">
            <span className="text-foreground">{rank.tp}</span> / {DIVISION_TP} TP
          </span>
        )}{" "}
        <FaceOffStakeOutcome label="Victoire" tp={stake.win.tp}>
          {win}
        </FaceOffStakeOutcome>
      </p>
      <p className="text-sm text-muted-foreground">
        <FaceOffStakeOutcome label="Défaite" tp={stake.loss.tp}>
          {loss}
        </FaceOffStakeOutcome>
      </p>
    </section>
  );
};
