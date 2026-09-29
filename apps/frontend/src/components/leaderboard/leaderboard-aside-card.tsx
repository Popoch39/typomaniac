import { cn } from "cn";
import { type ReactNode, useId } from "react";

type LeaderboardAsideCardProps = { title: string; className?: string; children: ReactNode };

// A card of the Classement's right column, named by its small title.
export const LeaderboardAsideCard = ({ title, className, children }: LeaderboardAsideCardProps) => {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex flex-col rounded-card bg-card", className)}
    >
      <h2
        id={titleId}
        className="font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  );
};
