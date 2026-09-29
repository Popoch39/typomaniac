import { cn } from "cn";
import type { ReactNode } from "react";

import type { FriendAction } from "@/api/friends";
import { useFriendAction } from "@/components/friends/use-friend-action";
import { Button } from "@/components/ui/button";

type FriendActionButtonVariant = "default" | "outline" | "ghost";

// Each variant as the Friends board draws it on a row: the answer awaited on the accent, bolder;
// the quiet ones in the secondary text.
const VARIANT_PAINT: Record<FriendActionButtonVariant, string> = {
  default: "px-4 font-bold",
  outline: "px-3.5",
  ghost: "px-3.5 text-muted-foreground",
};

type FriendActionButtonProps = {
  action: FriendAction;
  userId: string;
  variant?: FriendActionButtonVariant;
  // Read by a screen reader: the visible label alone does not say who it acts on.
  label: string;
  className?: string;
  children: ReactNode;
};

// Runs one action on another User, disabled while it runs.
export const FriendActionButton = ({
  action,
  userId,
  variant = "outline",
  label,
  className,
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
      className={cn("rounded-[14px]", VARIANT_PAINT[variant], className)}
    >
      {children}
    </Button>
  );
};
