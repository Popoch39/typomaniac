import { liveWpm, type RunState } from "typing-engine";

type OpponentWpmProps = { name: string; run: RunState; elapsed: number };

// The opponent's wpm so far, `elapsed` ms into the Duel, from their Run.
export const OpponentWpm = ({ name, run, elapsed }: OpponentWpmProps) => (
  <p className="text-xl text-opponent-caret font-mono tabular-nums">
    <span className="sr-only">wpm de {name} : </span>
    {Math.round(liveWpm(run, Math.max(0, elapsed)))} <span aria-hidden="true">wpm</span>
  </p>
);
