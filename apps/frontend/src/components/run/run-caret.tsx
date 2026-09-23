import type { Ref } from "react";

// The typing caret, moved by `transform`. It glides from letter to letter, unless the user asked
// for reduced motion.
export const RunCaret = ({ ref }: { ref: Ref<HTMLSpanElement> }) => (
  <span
    ref={ref}
    aria-hidden
    className="absolute top-[0.15lh] left-0 h-[0.7lh] w-0.5 -translate-x-1/2 rounded-full bg-caret transition-transform duration-100 ease-out motion-reduce:transition-none"
  />
);
