import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import { FIRE } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { TierUpCrownFire } from "@/components/tier-up/choreography/maniac/tier-up-crown-fire";
import { TierUpManiacWings } from "@/components/tier-up/choreography/maniac/tier-up-maniac-wings";
import { TierUpEmblemBody } from "@/components/tier-up/parts/tier-up-emblem-body";
import { PINGED, POPPED_STUDS } from "@/components/tier-up/parts/tier-up-popped";
import { EMBLEM_LAYERS, MANIAC_SET_GEMS } from "@/components/tier/sprite/tier-emblem-layers";

// A layer of the Emblem, over the others, on its 32 × 32 grid.
const LAYER = "absolute inset-0 size-full overflow-visible";

// What the crown's engraving lights one by one: each gem (its circles), scaled about its own
// centre by `--pop`, and the flame over it (its last group), stretched from its foot by
// `--flare-x` / `--flare-y` and licking sideways by `--lick` (deg), as the canvas's
// `transform-box: fill-box` does. GSAP moves the variables, never an SVG transform.
const IGNITED = `${POPPED_STUDS} [&>g:last-child]:origin-bottom [&>g:last-child]:[transform-box:fill-box] [&>g:last-child]:[transform:scale(var(--flare-x,1),var(--flare-y,1))_skewX(calc(var(--lick,0)*1deg))]`;

// The crown's fire painted as the artboard paints it, hotter and redder than the sprite's: its gems,
// its flame and the flame's heart, nearly opaque, each in its gradient of `CROWN_FIRE` (the ids
// spelled out: Tailwind only reads whole class names).
const ABLAZE =
  "[&>circle]:[fill:url(#tier-up-gem-fire)] [&>g:last-child>path:first-child]:[fill:url(#tier-up-flame-fire)] [&>g:last-child>path:last-child]:[fill:url(#tier-up-flame-heart)] [&>g:last-child>path:last-child]:opacity-90";

// The Emblem of the Tier reached, the Maniac's crown, as the Diamant → Maniac artboard brings it
// in, 320 px: it drops from above after the silence and lands with a quake, squashed then whole;
// its gems light one by one, a ring of fire flying off each of the three in its band, and its
// flame catches; its wings spread feather by feather; then, as it catches fire, it swells and its
// full Aura lights up from behind (under the wings and the metal, never over them). Only seen: the
// name under it says the Tier. The wrappers move, never the drawing.
export const TierUpIgnitedEmblem = ({ tier }: { tier: Tier }) => {
  const { body, engraving } = EMBLEM_LAYERS[tier];

  return (
    <div
      data-tier-up="emblem"
      data-tier={tier}
      aria-hidden
      className="absolute top-[190px] left-[560px] size-[320px]"
    >
      <div data-tier-up="swell" className="absolute inset-0">
        {/* Its body drawn once more over the Aura's canvas, hidden under the one dropped: only
            the Aura's light shows, once it has caught fire. */}
        <div data-tier-up="aura" className="absolute inset-0 opacity-0">
          <AuraFrame tier={tier} aura="full" Drawing={TierUpEmblemBody} />
        </div>
        <TierUpManiacWings tier={tier} />
        <div data-tier-up="drop" className="absolute inset-0 opacity-0">
          <svg viewBox="0 0 32 32" className={LAYER}>
            <TierUpCrownFire />
            <g data-tier-up="body">{body}</g>
            <g data-tier-up="engraving" className={`${IGNITED} ${ABLAZE}`}>
              {engraving}
            </g>
            <g data-tier-up="pings" className={PINGED}>
              {/* A ring of fire flying off each gem of the band as it lights. */}
              {MANIAC_SET_GEMS.map(([cx, cy, r]) => (
                <circle
                  key={cx}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={FIRE.spark}
                  strokeWidth={0.3}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
