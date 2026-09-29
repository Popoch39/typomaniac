import { DuelElsewhere } from "@/components/duel/duel-elsewhere";
import { DuelHandleRequired } from "@/components/duel/duel-handle-required";
import { DuelQueue } from "@/components/duel/duel-queue";
import { MatchProposal } from "@/components/match-proposal/match-proposal";
import { useDuelStore } from "@/stores/duel-store";

// In Duel, on the play page in place of the typing area: the Queue and its Match proposal. The
// place is held above the pages (DuelPlace); a Duel found goes to its own URL (DuelOnItsUrl), so
// nothing is shown here from its Countdown on.
export const DuelArea = () => {
  const state = useDuelStore((store) => store.state);

  switch (state.phase) {
    case "connecting":
    case "queued":
    case "locked":
      return <DuelQueue />;
    case "proposed":
      return (
        <>
          <DuelQueue />
          <MatchProposal proposal={state.proposal} />
        </>
      );
    case "handle-required":
      return <DuelHandleRequired />;
    case "elsewhere":
      return <DuelElsewhere />;
    case "countdown":
    case "running":
    case "finishing":
    case "ended":
    case "disconnected":
      return null;
  }
};
