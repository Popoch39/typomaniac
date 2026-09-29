import type { ComponentProps } from "react";

// The big figure left of the Text that says how far the Run is: the time left or the words done.
export const RunCounter = (props: ComponentProps<"p">) => (
  <p
    className="font-mono text-[34px] leading-none font-semibold text-caret tabular-nums"
    {...props}
  />
);
