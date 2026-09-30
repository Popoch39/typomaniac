import type { ReactNode } from "react";

type ProfileTitleProps = { id: string; title: string; line: ReactNode };

// Beside the avatar of a Profile's header: the Handle as the page's title, then a line under it.
// Positioned after the avatar: drawn over the Ornament's overflow, never under it.
export const ProfileTitle = ({ id, title, line }: ProfileTitleProps) => (
  <div className="relative flex min-w-0 flex-1 flex-col gap-1">
    <h1 id={id} className="truncate text-[40px] leading-[1.1] font-extrabold tracking-[-0.02em]">
      {title}
    </h1>
    <div className="text-[15px] text-muted-foreground">{line}</div>
  </div>
);
