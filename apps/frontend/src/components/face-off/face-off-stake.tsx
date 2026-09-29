import type { Rank, Stake } from "ranked";

import { signedTp } from "@/components/tier/rank/rank-label";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FaceOffStakeProps = { rank: Rank | null; stake: Stake | null };

// This User's Stake in the Face-off, under their rank and Form: the TP a win and a loss would
// move, exactly what the Duel applies, in ink on their colour. Only the TP: never the rank they
// lead to. Nothing for a Challenge or in Placement: no TP moves.
export const FaceOffStake = ({ rank, stake }: FaceOffStakeProps) => {
  const locale = useLocale();

  if (stake === null || rank === null || "placementsLeft" in rank) {
    return null;
  }

  // The signs tell the two apart on screen; screen readers get their names.
  return (
    <section
      aria-label={m.face_off_stake({}, { locale })}
      className="flex gap-5 font-mono text-lg font-semibold tabular-nums opacity-80"
    >
      <p>
        <span className="sr-only">{m.face_off_win({}, { locale })} </span>
        {signedTp(stake.win.tp, locale)}
      </p>{" "}
      <p>
        <span className="sr-only">{m.face_off_loss({}, { locale })} </span>
        {signedTp(stake.loss.tp, locale)}
      </p>
    </section>
  );
};
