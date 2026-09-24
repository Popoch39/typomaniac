import type { ReactNode } from "react";

import { ChallengeTimeLeft } from "@/components/challenge/challenge-time-left";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";

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
  <li className="flex flex-col gap-3 border border-foreground/15 bg-popover p-3 text-popover-foreground shadow-lg">
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        {user.image ? <AvatarImage src={user.image} alt="" /> : null}
        <AvatarFallback>{initials(user.handle)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">{title}</span>
      <ChallengeTimeLeft expiresAt={expiresAt} />
    </div>
    <div className="flex justify-end gap-1">{children}</div>
  </li>
);
