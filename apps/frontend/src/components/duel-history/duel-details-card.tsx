import type { ReactNode } from "react";

type DuelDetailsCardProps = { titleId?: string; children: ReactNode };

// The card of the chosen Duel beside the Duel history, named by its title once it has one.
export const DuelDetailsCard = ({ titleId, children }: DuelDetailsCardProps) => (
  <section
    aria-labelledby={titleId}
    className="flex flex-col gap-5 rounded-card bg-card px-7 pt-6.5 pb-7"
  >
    {children}
  </section>
);
