import { cn } from "cn";
import { type ReactNode, useId } from "react";

type PlayCardProps = {
  title: string;
  pitch: string;
  // The live zone, above the title: a Text, a Crest, two avatars.
  live: ReactNode;
  // Its actions, under the pitch.
  children: ReactNode;
  // Its surface and its ink: the card's, or the accent for the Ranked.
  className?: string;
  // The pitch's own ink, faint on a card.
  pitchClassName?: string;
  // The card the search comes out of, the Ranked: all of it is the search's surface.
  search?: boolean;
};

// One of Jouer's cards, named by its title: its live zone, its title and pitch, then its actions.
// A part the Intro brings in; it fades out as the search is launched. A size container: its
// padding and its title follow its width (`cqi`), from a 1024 px window to a wide one; its height
// is the row's, never its content's, and it gives up whole blocks when short: the live zone
// (`play-card-short`, `play-live-short`), then the pitch (`play-card-cramped`), taken out of the
// layout and of the tab order.
// Its title and its actions always stay.
export const PlayCard = ({
  title,
  pitch,
  live,
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
        "flex min-w-0 flex-1 flex-col rounded-card shadow-[0_0_0_rgb(0_0_0/0)] [container:play-card_/_size]",
        className,
      )}
    >
      <div className="flex h-full flex-col gap-3.5 p-[min(2rem,7cqi)]">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden [container:play-live_/_size] *:play-card-short:hidden *:play-live-short:hidden">
          {live}
        </div>
        <h2
          id={titleId}
          className="text-[min(32px,12cqi)] leading-tight font-extrabold tracking-[-0.02em]"
        >
          {title}
        </h2>
        <p className={cn("leading-normal play-card-cramped:hidden", pitchClassName)}>{pitch}</p>
        {children}
      </div>
    </section>
  );
};
