import { cn } from "cn";
import { SwordsIcon } from "lucide-react";

import { challengeBlocker } from "@/components/challenge/challenge-blocker";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { sendToServer, useConnectionStore } from "@/stores/connection-store";

type ChallengeButtonProps = {
  friend: { id: string; handle: string };
  // The swords alone, where a row is too narrow for the word: the sidebar's.
  iconOnly?: boolean;
};

// Défier: sends a Challenge to a Friend online. Disabled, with the reason, while it cannot.
export const ChallengeButton = ({ friend, iconOnly = false }: ChallengeButtonProps) => {
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
        size={iconOnly ? "icon" : "default"}
        variant={iconOnly ? "ghost" : "secondary"}
        aria-label={blocker === null ? label : `${label} : ${blocker}`}
        disabled={blocker !== null}
        onClick={challenge}
        className={cn(
          "rounded-[14px]",
          iconOnly ? "text-muted-foreground [&_svg]:size-4.5" : "pr-3.5 pl-3",
        )}
      >
        <SwordsIcon aria-hidden />
        {iconOnly ? null : "Défier"}
      </Button>
    </span>
  );
};
