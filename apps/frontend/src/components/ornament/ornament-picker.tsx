import { cn } from "cn";
import { useId } from "react";
import { canWear, isPlacement, type Standing } from "ranked";

import type { Me } from "@/api/me";
import { OrnamentOption } from "@/components/ornament/ornament-option";
import { ORNAMENT_OPTIONS } from "@/components/ornament/ornament-options";
import { useSaveOrnament } from "@/components/ornament/use-save-ornament";
import { SMALL_TITLE_PAINT } from "@/components/small-title-paint";

// What the picker says under its tiles: why everything is locked in Placement (or without a
// Rating), how the locked Ornaments open up; nothing once every one is open.
const hintOf = (standing: Standing | null) => {
  if (standing === null) {
    return "Termine ton Placement";
  }

  return ORNAMENT_OPTIONS.every((option) => canWear(standing, option.choice))
    ? null
    : "Ceux des Tiers au-dessus du tien se débloquent en y montant.";
};

// The Ornament the User wears, chosen by mouse or arrow keys on a grid of 9: « Suivre mon Tier »,
// « Aucun », then each Tier's. What they may not wear is locked: the Tiers above their own,
// everything in Placement. The choice shows while it is being saved.
export const OrnamentPicker = ({ me, handle }: { me: Me; handle: string }) => {
  const save = useSaveOrnament(handle);
  const name = useId();
  const hintId = useId();
  const chosen = save.isPending ? save.variables : me.ornamentChoice;
  // The User's rank once past Placement: null until then, or without a Rating.
  const standing = me.rank === null || isPlacement(me.rank) ? null : me.rank;
  const hint = hintOf(standing);

  return (
    <fieldset aria-describedby={hint === null ? undefined : hintId} className="flex flex-col gap-3">
      <legend className={cn("mb-3", SMALL_TITLE_PAINT)}>Ornament</legend>
      <div className="grid grid-cols-3 gap-2">
        {ORNAMENT_OPTIONS.map((option) => (
          <OrnamentOption
            key={option.choice}
            name={name}
            option={option}
            followedTier={standing?.tier ?? null}
            checked={option.choice === chosen}
            locked={standing === null || !canWear(standing, option.choice)}
            onChoose={() => save.mutate(option.choice)}
          />
        ))}
      </div>
      {hint === null ? null : (
        <p id={hintId} className="text-xs leading-normal text-muted-foreground">
          {hint}
        </p>
      )}
    </fieldset>
  );
};
