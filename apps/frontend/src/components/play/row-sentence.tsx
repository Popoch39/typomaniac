import type { ReactNode } from "react";

// The sentence of a row of a card's list, its Handles as `RowHandle`: its words are anonymous flex
// items that never shrink (`whitespace-pre` keeps their spaces), always whole; its Handles shrink.
export const RowSentence = ({ children }: { children: ReactNode }) => (
  <span className="flex min-w-0 font-semibold whitespace-pre">{children}</span>
);
