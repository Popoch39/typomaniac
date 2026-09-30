import { cn } from "cn";
import type { ReactNode } from "react";

type DuelEndRecordStampProps = { className: string; children: ReactNode };

// A Record's stamp, in the accent on the ground's colour, set askew on the accent it lands on: the
// band's beside the Score, the tiles' « Nouveau record ». Each sizes and tilts its own.
export const DuelEndRecordStamp = ({ className, children }: DuelEndRecordStampProps) => (
  <span
    className={cn(
      "bg-background font-display font-extrabold tracking-[0.08em] text-brand uppercase",
      className,
    )}
  >
    {children}
  </span>
);
