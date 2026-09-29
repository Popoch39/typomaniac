import { LockIcon } from "lucide-react";
import type { Tier } from "ranked";

import type { OrnamentOption } from "@/components/ornament/ornament-options";
import { TierOrnament } from "@/components/tier/drawing/tier-ornament";

type OrnamentPreviewProps = {
  option: OrnamentOption;
  // The Tier « Suivre mon Tier » wears: the User's, null in Placement or without a Rating (where
  // every option is locked).
  followedTier: Tier | null;
  locked: boolean;
};

// Over an option's name, what it puts on the avatar: a Tier's Ornament (the User's own for « Suivre
// mon Tier »), an empty frame for « Aucun », a padlock in place of what may not be worn.
export const OrnamentPreview = ({ option, followedTier, locked }: OrnamentPreviewProps) => {
  const tier = option.choice === "follow" ? followedTier : option.tier;

  if (locked) {
    return <LockIcon aria-hidden strokeWidth={1.8} className="size-7.5 p-1" />;
  }

  return tier === null ? (
    <span className="size-7.5 rounded-[10px] border-[1.5px] border-dashed border-faint" />
  ) : (
    <span className="size-7.5">
      <TierOrnament tier={tier} />
    </span>
  );
};
