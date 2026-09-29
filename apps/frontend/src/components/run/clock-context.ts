import { createContext, use } from "react";

// Split out of the components so their files only export components (react/only-export-components).

// Returns the current time in milliseconds. Injected so tests drive the time by hand.
export type Clock = () => number;

// The clock the connection reads the server's times on (connection-store): another tab's wait in
// the Queue, the Queue lock, as the Challenges' expiries.
export const wallClock: Clock = () => Date.now();

export const ClockContext = createContext<Clock>(() => performance.now());

export const useClock = () => use(ClockContext);
