import type { ReactNode } from "react";

import { cn } from "cn";

type PrototypeAvatarProps = { box: string; avatar: string; children: ReactNode };

// PROTOTYPE, throwaway: an avatar in its Ornament's box, twice its size, as `UserAvatar` lays
// it: the Ornament and its Aura behind, the squircle over them.
export const PrototypeAvatar = ({ box, avatar, children }: PrototypeAvatarProps) => (
  <div className={cn("relative isolate grid place-items-center", box)}>
    <div className="absolute inset-0 -z-10">{children}</div>
    <div
      className={cn(
        "grid place-items-center rounded-[33%] bg-surface-2 font-bold text-text-secondary",
        avatar,
      )}
    >
      AD
    </div>
  </div>
);
