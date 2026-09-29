import { cn } from "cn";
import type { ComponentProps } from "react";

// A key of the keyboard, named in a line of text: a small Martian Mono cap on the surface.
export const Kbd = ({ className, ...props }: ComponentProps<"kbd">) => (
  <kbd
    data-slot="kbd"
    className={cn(
      "inline-flex w-fit items-center justify-center rounded-lg bg-card px-2 py-1 font-mono text-[11px] text-foreground select-none",
      className,
    )}
    {...props}
  />
);
