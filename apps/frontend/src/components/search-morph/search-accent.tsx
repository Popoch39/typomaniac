import { cn } from "cn";
import { useRef } from "react";

import { useAccentFade } from "@/components/search-morph/use-accent-fade";

// The accent of the search carrying a Match proposal (the pill's fill, the card's outline), a layer
// over its surface and under its content, which fades in as it comes.
export const SearchAccent = ({ className }: { className: string }) => {
  const accentRef = useRef<HTMLDivElement>(null);

  useAccentFade(accentRef);

  return (
    <div
      ref={accentRef}
      aria-hidden
      data-search-accent
      className={cn("absolute inset-0 -z-10", className)}
    />
  );
};
