import { createContext, use } from "react";

// Split out of the components so their files only export components (react/only-export-components).

// Returns the current time in milliseconds. Injected so tests drive the time by hand.
export type Clock = () => number;

export const ClockContext = createContext<Clock>(() => performance.now());

export const useClock = () => use(ClockContext);
