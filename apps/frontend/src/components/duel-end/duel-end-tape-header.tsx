import type { ReactNode } from "react";

// A column's name, for screen readers only: the board draws none, and the row keeps no height.
export const DuelEndTapeHeader = ({ children }: { children: ReactNode }) => (
  <th scope="col" className="p-0">
    <span className="sr-only">{children}</span>
  </th>
);
