import { type ReactNode, useId } from "react";

type FriendsListSectionProps = {
  title: string;
  count: number;
  // Shown instead of the list when it is empty.
  empty: string;
  children: ReactNode;
};

// A titled list of Users on the Friends page, with its count.
export const FriendsListSection = ({ title, count, empty, children }: FriendsListSectionProps) => {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2
        id={titleId}
        className="text-[0.7rem] font-medium text-muted-foreground uppercase font-mono tabular-nums"
      >
        {title} ({count})
      </h2>
      {count === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y border border-foreground/15">{children}</ul>
      )}
    </section>
  );
};
