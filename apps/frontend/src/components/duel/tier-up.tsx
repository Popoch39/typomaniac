import { type Standing } from "ranked";
import { useRef } from "react";

import { RankReached } from "@/components/duel/rank-reached";
import { TierUpEmblem } from "@/components/duel/tier-up-emblem";
import { TpBar } from "@/components/duel/tp-bar";
import { TpDelta } from "@/components/duel/tp-delta";
import { useTierUpSound } from "@/components/duel/use-tier-up-sound";
import { useTierUpTimeline } from "@/components/duel/use-tier-up-timeline";
import { standingName } from "@/components/tier/tier";

type TierUpProps = { tp: number; standing: Standing };

// A ranked Duel that moved up into a new Tier or Maniac: its moment, in place of the plain TP.
// The emblem lands in its halo with a sound, then the title, the TP won and the rank reached,
// which fills its bar from the start of the Division. Still under reduced motion.
export const TierUp = ({ tp, standing }: TierUpProps) => {
  const scope = useRef<HTMLDivElement>(null);

  useTierUpTimeline(scope);
  useTierUpSound();

  return (
    <div ref={scope} className="flex flex-col items-center gap-4">
      <TierUpEmblem tier={standing.tier} />
      <div data-tier-up="details" className="flex w-full flex-col items-center gap-4">
        <p className="text-2xl font-extrabold text-primary">{`Nouveau Tier : ${standingName(standing)} !`}</p>
        <div className="flex items-center gap-6">
          <TpDelta tp={tp} />
          <RankReached standing={standing} />
        </div>
        {standing.tier === "maniac" ? null : (
          <div className="w-full">
            <TpBar before={0} after={standing.tp} />
          </div>
        )}
      </div>
    </div>
  );
};
