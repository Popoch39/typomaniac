import { useEffect } from "react";

import { useCardHandoff } from "@/components/duel-bridge/use-card-handoff";
import { useDuelElapsed } from "@/components/duel/use-duel-elapsed";
import { FaceOff } from "@/components/face-off/face-off";
import { beforeCountdown, COVERED_MS, EXIT_MS } from "@/components/face-off/face-off-timeline";
import { MatchProposalGo } from "@/components/match-proposal/match-proposal-go";
import { type BridgedDuel, coverScene, releaseBridge } from "@/stores/duel-bridge-store";

// The Duel on its way, on the Duel's clock: « C'est parti ! » the second before the Countdown
// (the copy of the card it came from, where it was, or the card in the middle without one), then
// the Face-off, whose panels open out of the card and cover the screen for the Duel's scene and
// URL to show under them, up to the end of its exit.
export const BridgedFaceOff = ({ bridged }: { bridged: BridgedDuel }) => {
  const { id, opponent, pairing, startsAt, card } = bridged;
  const elapsed = useDuelElapsed(startsAt);
  const counting = !beforeCountdown(elapsed);
  const covered = elapsed >= COVERED_MS;
  const over = elapsed >= EXIT_MS;

  useCardHandoff(card, counting);

  useEffect(() => {
    if (covered) {
      coverScene();
    }
  }, [covered]);

  useEffect(() => {
    if (over) {
      releaseBridge();
    }
  }, [over]);

  return (
    <>
      {counting || card !== null ? null : <MatchProposalGo opponent={opponent} pairing={pairing} />}
      <FaceOff
        key={id}
        opponent={opponent}
        pairing={pairing}
        startsAt={startsAt}
        elapsed={elapsed}
        card={card?.rect ?? null}
      />
    </>
  );
};
