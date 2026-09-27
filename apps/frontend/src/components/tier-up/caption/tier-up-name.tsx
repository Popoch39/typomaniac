import { Dialog } from "@base-ui/react/dialog";
import type { Tier } from "ranked";

import { TIER_NAMES } from "@/components/tier/tier";
import type { NameLook } from "@/components/tier-up/choreography/tier-up-choreography";
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

// The name of the Tier reached, huge, set as its artboard sets it, each letter in the metal of its
// Emblem so that it can come in on its own; read whole, as the dialog's title.
export const TierUpName = ({ tier, look }: { tier: Tier; look: NameLook }) => {
  const name = TIER_NAMES[tier];
  const paint = tierUpPaint(tier);

  return (
    <Dialog.Title
      className="flex font-black uppercase"
      style={{
        fontSize: look.size,
        lineHeight: look.leading,
        letterSpacing: `${look.tracking}em`,
        paddingLeft: `${look.tracking}em`,
        filter: paint.nameShadow(look.shadow),
      }}
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
