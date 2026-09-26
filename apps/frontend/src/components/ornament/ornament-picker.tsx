import { useId } from "react";
import { canWear, isPlacement } from "ranked";

import type { Me } from "@/api/me";
import { OrnamentOption } from "@/components/ornament/ornament-option";
import { ORNAMENT_OPTIONS } from "@/components/ornament/ornament-options";
import { useSaveOrnament } from "@/components/ornament/use-save-ornament";

// On the User's own Profile, under their avatar: the Ornament they wear, by mouse or arrow keys.
// What they may not wear is locked: the Tiers above their own, everything in Placement. The
// choice shows while it is being saved.
export const OrnamentPicker = ({ me, handle }: { me: Me; handle: string }) => {
  const save = useSaveOrnament(handle);
  const name = useId();
  const hintId = useId();
  const chosen = save.isPending ? save.variables : me.ornamentChoice;
  const placement = me.rank === null || isPlacement(me.rank);

  return (
    <fieldset aria-describedby={placement ? hintId : undefined} className="flex flex-col gap-2">
      <legend className="mb-2 text-[0.7rem] font-medium text-muted-foreground uppercase">
        Ornament
      </legend>
      <div className="flex flex-wrap gap-2">
        {ORNAMENT_OPTIONS.map((option) => (
          <OrnamentOption
            key={option.choice}
            name={name}
            option={option}
            checked={option.choice === chosen}
            locked={me.rank === null || !canWear(me.rank, option.choice)}
            onChoose={() => save.mutate(option.choice)}
          />
        ))}
      </div>
      {placement ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          Termine ton Placement
        </p>
      ) : null}
    </fieldset>
  );
};
