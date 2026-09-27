import { Dialog } from "@base-ui/react/dialog";
import type { Tier } from "ranked";

import { TIER_NAMES } from "@/components/tier/tier";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// The letters of `name`, each keyed by itself and how many times it came before (« Maniac »
// has two a).
const lettersOf = (name: string) => {
  const seen = new Map<string, number>();

  return [...name].map((letter) => {
    const before = seen.get(letter) ?? 0;

    seen.set(letter, before + 1);

    return { letter, key: `${letter}${before}` };
  });
};

// The name of the Tier reached, huge, each letter in the metal of its Emblem so that it can come
// in on its own; read whole, as the dialog's title.
export const TierUpName = ({ tier }: { tier: Tier }) => {
  const name = TIER_NAMES[tier];
  const paint = tierUpPaint(tier);

  return (
    <Dialog.Title
      className="flex pl-[0.06em] text-[124px] leading-[1.02] font-black tracking-[0.06em] uppercase"
      style={{ filter: paint.nameShadow }}
    >
      <span className="sr-only">{name}</span>
      {lettersOf(name).map(({ letter, key }) => (
        <span
          key={key}
          aria-hidden
          data-tier-up="letter"
          className="inline-block bg-clip-text text-transparent"
          style={{ backgroundImage: paint.metal }}
        >
          {letter}
        </span>
      ))}
    </Dialog.Title>
  );
};
