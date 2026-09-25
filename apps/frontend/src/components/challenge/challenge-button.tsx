import { SwordsIcon } from "lucide-react";

import { challengeBlocker } from "@/components/challenge/challenge-blocker";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { sendToServer, useConnectionStore } from "@/stores/connection-store";

type ChallengeButtonProps = {
  friend: { id: string; handle: string };
};

// Défier: sends a Challenge to a Friend online. Disabled, with the reason, while it cannot.
export const ChallengeButton = ({ friend }: ChallengeButtonProps) => {
  const blocker = useConnectionStore((store) => challengeBlocker(store, friend.id));
  const { unlock: unlockSounds } = useFaceOffSounds();
  const label = `Défier ${atHandle(friend.handle)}`;

  // The Duel of an accepted Challenge opens on the Face-off here too: this click lets it sound.
  const challenge = () => {
    unlockSounds();
    sendToServer({ type: "send-challenge", userId: friend.id });
  };

  return (
    // A disabled button gets no pointer events: the reason's tooltip is on its wrapper.
    <span title={blocker ?? undefined}>
      <Button
        size="sm"
        variant="outline"
        aria-label={blocker === null ? label : `${label} : ${blocker}`}
        disabled={blocker !== null}
        onClick={challenge}
      >
        <SwordsIcon aria-hidden />
        Défier
      </Button>
    </span>
  );
};
