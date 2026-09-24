import { SwordsIcon } from "lucide-react";

import { challengeBlocker } from "@/components/challenge/challenge-blocker";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { sendToServer, useConnectionStore } from "@/stores/connection-store";

type ChallengeButtonProps = {
  friend: { id: string; handle: string };
};

// Défier: sends a Challenge to a Friend online. Disabled, with the reason, while it cannot.
export const ChallengeButton = ({ friend }: ChallengeButtonProps) => {
  const blocker = useConnectionStore((store) => challengeBlocker(store, friend.id));
  const label = `Défier ${atHandle(friend.handle)}`;

  return (
    // A disabled button gets no pointer events: the reason's tooltip is on its wrapper.
    <span title={blocker ?? undefined}>
      <Button
        size="sm"
        variant="outline"
        aria-label={blocker === null ? label : `${label} : ${blocker}`}
        disabled={blocker !== null}
        onClick={() => sendToServer({ type: "send-challenge", userId: friend.id })}
      >
        <SwordsIcon aria-hidden />
        Défier
      </Button>
    </span>
  );
};
