import { liveWpm } from "typing-engine";

import { duelOf, useDuelStore } from "@/stores/duel-store";

// The opponent's wpm so far, `elapsed` ms into the Duel, rebuilt from their relayed Keystrokes.
export const OpponentWpm = ({ name, elapsed }: { name: string; elapsed: number }) => {
  const opponentRun = useDuelStore((store) => duelOf(store.state)?.opponentRun ?? null);
  const wpm = opponentRun === null ? 0 : liveWpm(opponentRun, Math.max(0, elapsed));

  return (
    <p className="text-xl text-opponent-caret font-mono tabular-nums">
      <span className="sr-only">wpm de {name} : </span>
      {Math.round(wpm)} <span aria-hidden="true">wpm</span>
    </p>
  );
};
