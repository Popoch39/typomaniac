import type { ReactNode } from "react";

type ErrorStateProps = {
  title: string;
  happened: ReactNode;
  cost: ReactNode;
  action?: ReactNode;
  // A whole page's error titles the page (h1); one inside a page sits under its title (h2).
  heading?: "h1" | "h2";
};

// Something went wrong: what happens, what it costs the User, and a way out.
export const ErrorState = ({
  title,
  happened,
  cost,
  action,
  heading: Heading = "h1",
}: ErrorStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
    <Heading className="text-lg font-bold">{title}</Heading>
    <p className="max-w-sm text-sm text-muted-foreground">{happened}</p>
    <p className="max-w-sm text-sm text-muted-foreground">{cost}</p>
    {action}
  </div>
);
