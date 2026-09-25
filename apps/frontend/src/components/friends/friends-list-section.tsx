import { type ReactNode, useId } from "react";

type FriendsListSectionProps = {
  title: string;
  count: number;
  // Shown instead of the list when it is empty.
  empty: ReactNode;
  children: ReactNode;
};

// A titled list of Users on the Friends page, with its count, on a card.
export const FriendsListSection = ({ title, count, empty, children }: FriendsListSectionProps) => {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2
        id={titleId}
        className="px-1 font-mono text-[0.7rem] font-medium text-muted-foreground uppercase tabular-nums"
      >
        {title} ({count})
      </h2>
      {count === 0 ? (
        empty
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card bg-card">
          {children}
        </ul>
      )}
    </section>
  );
};
