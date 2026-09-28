import { cn } from "cn";

import { handleInitials } from "@/lib/handle-initials";

type DuelBandAvatarProps = {
  // Null while this User's is not read yet: the squircle stays empty.
  handle: string | null;
  tone: "own" | "opponent";
};

// A player in the band, as its board draws them: their initials in their colour on an ink
// squircle, not their avatar (the one exception to UserAvatar, limited to the Duel's HUD).
export const DuelBandAvatar = ({ handle, tone }: DuelBandAvatarProps) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex size-16 shrink-0 items-center justify-center rounded-[33%] bg-ink text-xl font-extrabold",
      tone === "own" ? "text-brand" : "text-opponent",
    )}
  >
    {handle === null ? null : handleInitials(handle)}
  </span>
);
