import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { duelOnRound, writtenDuelQueryOptions } from "@/api/duel-history";
import { RoundPicker } from "@/components/duel-rounds/round-picker";
import { ReplayHeader } from "@/components/replay/replay-header";
import { ReplayRound } from "@/components/replay/replay-round";

// A finished Duel played again: under its header, a Bo3's tabs R1 / R2 / R3 (its Rounds played,
// never one that was not), opened on the first, then the Round chosen, replayed from its start. A
// Duel of a single Round (a Challenge, a Duel from before the Bo3) has no tabs.
export const DuelReplay = ({ duelId }: { duelId: string }) => {
  const { data: written } = useSuspenseQuery(writtenDuelQueryOptions(duelId));
  const [shown, setShown] = useState(0);
  const indices = written.rounds.map(({ index }) => index);
  const round = written.rounds.find(({ index }) => index === shown) ?? written.rounds[0];
  const last = written.rounds.at(-1);

  // The API never sends a Duel without a Round (`minItems: 1`).
  if (typeof round === "undefined" || typeof last === "undefined") {
    return null;
  }

  const series = indices.length > 1;

  return (
    <div className="flex flex-col gap-5">
      {/* The Duel whole: how it ended, its Forfeit with it. */}
      <ReplayHeader duel={duelOnRound(written, last)} />
      {series ? <RoundPicker rounds={indices} value={round.index} onChange={setShown} /> : null}
      <ReplayRound
        // A new Round replays from its start.
        key={round.index}
        duel={duelOnRound(written, round)}
        average={
          series
            ? { own: written.me.result.wpm, opponent: written.opponent?.result.wpm ?? null }
            : null
        }
      />
    </div>
  );
};
