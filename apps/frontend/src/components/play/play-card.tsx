import { cn } from "cn";
import { type ReactNode, useId } from "react";

type PlayCardProps = {
  title: string;
  pitch: string;
  // What fills the card above its title: a Text, a Crest, two avatars.
  visual: ReactNode;
  // Its actions, under the pitch.
  children: ReactNode;
  // Its surface and its ink: the card's, or the accent for the Ranked.
  className?: string;
  // The pitch's own ink, faint on a card.
  pitchClassName?: string;
  // The card the search comes out of, the Ranked: all of it is the search's surface.
  search?: boolean;
};

// One of Jouer's cards, named by its title: what fills it, its title and pitch, then its actions.
// A part the Intro brings in; it fades out as the search is launched. A container: its padding and
// its title follow its width (`cqi`), from a 1024 px window to a wide one, and what fills it gives
// up its height first, never pushing the page past the window.
export const PlayCard = ({
  title,
  pitch,
  visual,
  children,
  className,
  pitchClassName,
  search = false,
}: PlayCardProps) => {
  const titleId = useId();

  return (
    <section
      data-intro="part"
      aria-labelledby={titleId}
      data-search-form={search ? "" : undefined}
      data-search-surface={search ? "" : undefined}
      data-flip-id={search ? "search-surface" : undefined}
      data-search-leaves
      className={cn(
        "@container flex min-w-0 flex-1 flex-col rounded-card shadow-[0_0_0_rgb(0_0_0/0)]",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 p-[min(2rem,7cqi)]">
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {visual}
        </div>
        <h2
          id={titleId}
          className="text-[min(32px,12cqi)] leading-tight font-extrabold tracking-[-0.02em]"
        >
          {title}
        </h2>
        <p className={cn("leading-normal", pitchClassName)}>{pitch}</p>
        {children}
      </div>
    </section>
  );
};
