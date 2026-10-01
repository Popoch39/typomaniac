import { SwordsIcon } from "lucide-react";

import { challengeBlocker } from "@/components/challenge/challenge-blocker";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { sendToServer, useConnectionStore } from "@/stores/connection-store";

type ChallengeButtonProps = {
  friend: { id: string; handle: string };
  // The swords alone, where a row is too narrow for the word: the sidebar's.
  iconOnly?: boolean;
};

// Défier: sends a Challenge to a Friend online. Disabled, with the reason, while it cannot.
export const ChallengeButton = ({ friend, iconOnly = false }: ChallengeButtonProps) => {
  const locale = useLocale();
  const blocker = useConnectionStore((store) => challengeBlocker(store, friend.id, locale));
  const { unlock: unlockSounds } = useFaceOffSounds();
  const handle = atHandle(friend.handle);

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
        variant={iconOnly ? "ghost" : "default"}
        aria-label={
          blocker === null
            ? m.challenge_send_label({ handle }, { locale })
            : m.challenge_send_label_blocked({ handle, reason: blocker }, { locale })
        }
        disabled={blocker !== null}
        onClick={challenge}
        className={
          iconOnly
            ? "rounded-[14px] text-muted-foreground [&_svg]:size-4.5"
            : "h-9 rounded-[12px] px-3.5 text-[13px] font-bold"
        }
      >
        {iconOnly ? <SwordsIcon aria-hidden /> : m.challenge_send({}, { locale })}
      </Button>
    </span>
  );
};
