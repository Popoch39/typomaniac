import { CHALLENGE_CARD_PAINT } from "@/components/challenge/challenge-card-paint";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type AcceptedChallengeCardProps = {
  // The other User of the Challenge: their avatar, never their name.
  user: { handle: string; image: string | null };
};

// A Challenge accepted, sent or received: « C'est parti ! », as a Match proposal accepted by both,
// until its Duel is found, when the Duel's bridge takes it over. Nothing left to answer.
export const AcceptedChallengeCard = ({ user }: AcceptedChallengeCardProps) => {
  const locale = useLocale();

  return (
    <li data-duel-bridge-card className={CHALLENGE_CARD_PAINT}>
      <div className="flex items-center gap-3">
        <UserAvatar handle={user.handle} image={user.image} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-bold">{m.proposal_ready_title({}, { locale })}</span>
          <span className="text-muted-foreground text-sm">
            {m.proposal_ready_subtitle({}, { locale })}
          </span>
        </span>
      </div>
    </li>
  );
};
