import { DuelElsewhere } from "@/components/duel/duel-elsewhere";
import { DuelHandleRequired } from "@/components/duel/duel-handle-required";
import { DuelQueue } from "@/components/duel/duel-queue";
import { useDuelStore } from "@/stores/duel-store";

// In Duel, on the play page in place of the typing area: the Queue. The place is held above the
// pages (DuelPlace), and so is its Match proposal (QueueProposal), shown over it; a Duel found goes
// to its own URL (DuelOnItsUrl), so nothing is shown here from its Countdown on.
export const DuelArea = () => {
  const phase = useDuelStore((store) => store.state.phase);

  switch (phase) {
    case "connecting":
    case "queued":
    case "proposed":
    case "locked":
      return <DuelQueue />;
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
