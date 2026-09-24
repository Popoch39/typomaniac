import { useEffect, useState } from "react";

const secondsUntil = (expiresAt: number) => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

// Whole seconds left before `expiresAt`, on this tab's clock (`Date.now()`), read a few times a
// second: React skips the render while the second shown stays the same.
export const useSecondsLeft = (expiresAt: number) => {
  const [left, setLeft] = useState(() => secondsUntil(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => setLeft(secondsUntil(expiresAt)), 250);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return left;
};
