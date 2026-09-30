import { type ReactNode, useId, useRef } from "react";

import { SearchAccent } from "@/components/search-morph/search-accent";
import { SearchSurface } from "@/components/search-morph/search-surface";
import { useSearchMorph } from "@/components/search-morph/use-search-morph";

type QueueCardProps = {
  title: string;
  subtitle: string;
  // Ringed in the accent, which fades in: the card carries a Match proposal.
  accent?: boolean;
  // The search's form on Jouer, unfolded: it comes from the Ranked card or the Queue pill.
  search?: boolean;
  // The card a Duel found comes from: the Duel's bridge takes it over (DuelBridge).
  bridged?: boolean;
  // Above the title, e.g. the search's ring.
  before?: ReactNode;
  // Under it: the wait, the buttons.
  children: ReactNode;
};

// The one card of the Queue screen, 620 px wide in the middle of the page, named by its title: the
// search, the Match proposal or the Queue lock in its place.
export const QueueCard = ({
  title,
  subtitle,
  accent = false,
  search = false,
  bridged = false,
  before,
  children,
}: QueueCardProps) => {
  const titleId = useId();
  const cardRef = useRef<HTMLElement>(null);

  useSearchMorph(cardRef);

  return (
    <section
      ref={cardRef}
      aria-labelledby={titleId}
      data-search-form={search ? "" : undefined}
      data-search-leaves
      data-duel-bridge-card={bridged ? "" : undefined}
      className="relative isolate flex w-155 flex-col items-center gap-6 px-10 pt-12 pb-10 text-center"
    >
      <SearchSurface className="rounded-card bg-card shadow-[0_0_0_rgb(0_0_0/0)]" />
      {accent ? (
        <SearchAccent className="rounded-card shadow-[0_40px_120px_rgb(0_0_0/0.55)] inset-ring-2 inset-ring-primary" />
      ) : null}
      {before}
      <div className="flex flex-col gap-2">
        <h2 id={titleId} className="text-[30px] font-extrabold tracking-[-0.02em]">
          {title}
        </h2>
        <p className="text-[15px] text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  );
};
