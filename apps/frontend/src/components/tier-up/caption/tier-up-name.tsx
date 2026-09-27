import { Dialog } from "@base-ui/react/dialog";
import type { Tier } from "ranked";

import { TierUpNameGhost } from "@/components/tier-up/caption/tier-up-name-ghost";
import type { NameLook } from "@/components/tier-up/choreography/tier-up-choreography";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TIER_NAMES } from "@/components/tier/tier";

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
// Emblem (or its artboard's own paint) so that it can come in on its own, or the whole word at
// once; read whole, as the dialog's title. Behind it, its ghosts, when its artboard has them.
export const TierUpName = ({ tier, look }: { tier: Tier; look: NameLook }) => {
  const name = TIER_NAMES[tier];
  const paint = tierUpPaint(tier);

  return (
    <Dialog.Title
      className="relative flex font-black uppercase"
      style={{
        fontSize: look.size,
        lineHeight: look.leading,
        letterSpacing: `${look.tracking}em`,
        paddingLeft: `${look.tracking}em`,
        filter: [look.glow, paint.nameShadow(look.shadow)].join(" ").trim(),
      }}
    >
      <span className="sr-only">{name}</span>
      {look.ghosts === undefined ? null : (
        <>
          <TierUpNameGhost
            side="left"
            name={name}
            color={look.ghosts.left}
            tracking={look.tracking}
          />
          <TierUpNameGhost
            side="right"
            name={name}
            color={look.ghosts.right}
            tracking={look.tracking}
          />
        </>
      )}
      <span data-tier-up="name" className="flex">
        {lettersOf(name).map(({ letter, key }) => (
          <span
            key={key}
            aria-hidden
            data-tier-up="letter"
            className="inline-block bg-clip-text text-transparent"
            style={{ backgroundImage: look.letters ?? paint.metal }}
          >
            {letter}
          </span>
        ))}
      </span>
    </Dialog.Title>
  );
};
