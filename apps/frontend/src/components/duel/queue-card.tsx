import { type ReactNode, useId } from "react";

type QueueCardProps = {
  title: string;
  subtitle: string;
  // Above the title, e.g. the search's ring.
  before?: ReactNode;
  // Under it: the wait, the buttons.
  children: ReactNode;
};

// The one card of the Queue screen, 620 px wide in the middle of the page, named by its title: the
// search, or the Queue lock in its place.
export const QueueCard = ({ title, subtitle, before, children }: QueueCardProps) => {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex w-155 flex-col items-center gap-6 rounded-card bg-card px-10 pt-12 pb-10 text-center"
    >
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
