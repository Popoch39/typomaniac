import type { ReactNode } from "react";

import type { FriendAction } from "@/api/friends";
import { useFriendAction } from "@/components/friends/use-friend-action";
import { Button } from "@/components/ui/button";

type FriendActionButtonProps = {
  action: FriendAction;
  userId: string;
  variant?: "default" | "outline" | "ghost";
  // Read by a screen reader: the visible label alone does not say who it acts on.
  label: string;
  children: ReactNode;
};

// Runs one action on another User, disabled while it runs.
export const FriendActionButton = ({
  action,
  userId,
  variant = "outline",
  label,
  children,
}: FriendActionButtonProps) => {
  const { mutate, isPending } = useFriendAction(action, userId);

  return (
    <Button
      size="sm"
      variant={variant}
      aria-label={label}
      disabled={isPending}
      onClick={() => mutate()}
    >
      {children}
    </Button>
  );
};
