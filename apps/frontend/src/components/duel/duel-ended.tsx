import type { Result } from "typing-engine";

import { RunResult } from "@/components/run/run-result";
import { Button } from "@/components/ui/button";
import { useDuelStore } from "@/stores/duel-store";

// Called once with the node on mount: the typing input is gone with the Duel.
const focusOnMount = (node: HTMLElement | null) => node?.focus();

// The time is up: this User's Result as replayed here, then Nouveau Duel to join the Queue again.
export const DuelEnded = ({ result }: { result: Result }) => {
  const joinQueue = useDuelStore((store) => store.joinQueue);

  return (
    <div ref={focusOnMount} tabIndex={-1} className="flex flex-col gap-8 outline-none">
      <RunResult result={result} />
      <div>
        <Button variant="outline" onClick={joinQueue}>
          Nouveau Duel
        </Button>
      </div>
    </div>
  );
};
