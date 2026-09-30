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
// A part the Intro brings in; it fades out as the search is launched.
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
        "flex min-w-0 flex-1 flex-col gap-3.5 rounded-card p-8 shadow-[0_0_0_rgb(0_0_0/0)]",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center">{visual}</div>
      <h2 id={titleId} className="text-[32px] leading-tight font-extrabold tracking-[-0.02em]">
        {title}
      </h2>
      <p className={cn("leading-normal", pitchClassName)}>{pitch}</p>
      {children}
    </section>
  );
};
