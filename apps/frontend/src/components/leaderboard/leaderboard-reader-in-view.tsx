import { type RefObject, useEffect } from "react";

// Mounted on arriving at the reader's own page (`?at=me`, from « Ta place »), once per navigation:
// their line, marked `aria-current` in `standings`, is scrolled to the middle of the window and
// takes the focus. At once under reduced motion.
export const LeaderboardReaderInView = ({
  standings,
}: {
  standings: RefObject<HTMLElement | null>;
}) => {
  useEffect(() => {
    const line = standings.current?.querySelector<HTMLElement>('[aria-current="true"]');

    if (!line) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    line.scrollIntoView({ block: "center", behavior: reduced ? "instant" : "smooth" });
    line.focus({ preventScroll: true });
  }, [standings]);

  return null;
};
