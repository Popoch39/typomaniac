import type { ChangeEvent } from "react";

import { SCRIPTED_MOMENTS } from "@/components/duel-hud-dev/scripted-moments";

// The option that plays the Duel in a loop.
const LOOP = "loop";

type DuelHudDevControlsProps = {
  // The moment the Duel is frozen on, in ms since GO; null while it plays in a loop.
  frozenAt: number | null;
  onFreeze: (frozenAt: number | null) => void;
};

// Plays the scripted Duel in a loop, or freezes it on one of the board's moments. Small, in the
// bottom left corner, where the board draws nothing.
export const DuelHudDevControls = ({ frozenAt, onFreeze }: DuelHudDevControlsProps) => {
  const choose = (event: ChangeEvent<HTMLSelectElement>) => {
    const moment = SCRIPTED_MOMENTS.find(({ at }) => String(at) === event.target.value);

    onFreeze(moment?.at ?? null);
  };

  return (
    <label className="fixed bottom-3 left-3 flex items-center gap-2 rounded-full bg-card py-1 pr-1 pl-4 text-sm text-muted-foreground">
      Moment
      <select
        value={frozenAt === null ? LOOP : String(frozenAt)}
        onChange={choose}
        className="h-9 rounded-full bg-secondary px-3 text-foreground"
      >
        <option value={LOOP}>en boucle</option>
        {SCRIPTED_MOMENTS.map(({ name, at }) => (
          <option key={at} value={String(at)}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
};
