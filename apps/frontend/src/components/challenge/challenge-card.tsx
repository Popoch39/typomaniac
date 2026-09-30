import type { ReactNode } from "react";

import { CHALLENGE_CARD_PAINT } from "@/components/challenge/challenge-card-paint";
import { ChallengeTimeLeft } from "@/components/challenge/challenge-time-left";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type ChallengeCardProps = {
  // The other User of the Challenge: their avatar, never their name.
  user: { handle: string; image: string | null };
  expiresAt: number;
  // What the Challenge is, with their Handle.
  title: ReactNode;
  // The answers to it.
  children: ReactNode;
};

// A Challenge waiting, as a card over the page: who, the seconds left, and the answers.
export const ChallengeCard = ({ user, expiresAt, title, children }: ChallengeCardProps) => (
  <li className={CHALLENGE_CARD_PAINT}>
    <div className="flex items-center gap-3">
      <UserAvatar handle={user.handle} image={user.image} size="sm" />
      <span className="min-w-0 flex-1">{title}</span>
      <ChallengeTimeLeft expiresAt={expiresAt} />
    </div>
    <div className="flex justify-end gap-1">{children}</div>
  </li>
);
