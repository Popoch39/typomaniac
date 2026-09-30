import { challengeBlocker } from "@/components/challenge/challenge-blocker";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { sendToServer, useConnectionStore } from "@/stores/connection-store";

type RematchButtonProps = { friend: { id: string; handle: string } };

// « Revanche ? » on a Duel a Friend online won against the User: sends them a Challenge, as Défier
// does, under its rules (one Challenge sent at a time): disabled with the reason while it cannot.
export const RematchButton = ({ friend }: RematchButtonProps) => {
  const locale = useLocale();
  const blocker = useConnectionStore((store) => challengeBlocker(store, friend.id, locale));
  const { unlock: unlockSounds } = useFaceOffSounds();
  const handle = atHandle(friend.handle);

  // The Duel of an accepted Challenge opens on the Face-off here too: this click lets it sound.
  const rematch = () => {
    unlockSounds();
    sendToServer({ type: "send-challenge", userId: friend.id });
  };

  return (
    // A disabled button gets no pointer events: the reason's tooltip is on its wrapper.
    <span title={blocker ?? undefined} className="shrink-0">
      <button
        type="button"
        aria-label={
          blocker === null
            ? m.play_friends_rematch_label({ friend: handle }, { locale })
            : m.challenge_send_label_blocked({ handle, reason: blocker }, { locale })
        }
        disabled={blocker !== null}
        onClick={rematch}
        className="rounded-md px-1 text-sm font-bold text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:text-muted-foreground disabled:no-underline"
      >
        {m.play_friends_rematch({}, { locale })}
      </button>
    </span>
  );
};
