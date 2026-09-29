import type { ReactNode } from "react";

// Duel is not played here: another tab plays the place, or the Duel was lost with the connection.
// `children` is the way back: the place taken here, or a new search.
export const DuelInterrupted = ({
  message,
  children,
}: {
  message: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-6 rounded-card bg-card px-8 py-12">
    <output className="text-muted-foreground">{message}</output>
    {children}
  </div>
);
