import { cn } from "cn";

// An avatar's place with no one in it, a squircle as avatars are: hidden from screen readers.
export const EmptyAvatar = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn("shrink-0 rounded-[33%] bg-surface-2", className)} />
);
