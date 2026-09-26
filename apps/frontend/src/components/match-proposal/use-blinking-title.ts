import { useEffect } from "react";

import { useTabAttention } from "@/components/tab-attention/tab-attention-context";

// How long the tab's title stays on each of its two texts.
const BLINK_MS = 1000;

// While `blinking`, the tab's title swaps between `alert` and its own every second, starting on
// `alert`. Its own is back as soon as it stops, or on unmount.
export const useBlinkingTitle = (blinking: boolean, alert: string) => {
  const attention = useTabAttention();

  useEffect(() => {
    if (!blinking) {
      return;
    }

    const original = attention.readTitle();
    let alerting = true;

    attention.writeTitle(alert);

    const timer = setInterval(() => {
      alerting = !alerting;
      attention.writeTitle(alerting ? alert : original);
    }, BLINK_MS);

    return () => {
      clearInterval(timer);
      attention.writeTitle(original);
    };
  }, [attention, blinking, alert]);
};
