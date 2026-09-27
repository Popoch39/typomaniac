import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import { EMBLEM_LAYERS, PLATINE_STUDS } from "@/components/tier/sprite/tier-emblem-layers";
import { EMBLEM_OUTLINES, STAR } from "@/components/tier/sprite/tier-emblem-outline";
import { PLATINE_TRIANGLES } from "@/components/tier-up/choreography/platine/platine-triangles";
import { TierUpWings } from "@/components/tier-up/choreography/platine/tier-up-wings";
import { TierUpEmblemBody } from "@/components/tier-up/parts/tier-up-emblem-body";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { POPPED_STUDS } from "@/components/tier-up/parts/tier-up-popped";
import { TierUpSheenBand } from "@/components/tier-up/parts/tier-up-sheen-band";

// A layer of the Emblem, over the others, on its 32 × 32 grid.
const LAYER = "absolute inset-0 size-full overflow-visible";

// The seams between the triangles, from the centre to each corner of the hexagon.
const SEAMS = "M16 16 L16 2 M16 16 L28 9 M16 16 L28 23 M16 16 L16 30 M16 16 L4 23 M16 16 L4 9";

// Each ring around a stud scaled about its own centre by `--ping`, as the artboard's
// `transform-box: fill-box` does: small and lit until it flies off, as in the canvas. GSAP moves
// the variable, never an SVG transform.
const PINGED =
  "[&>circle]:origin-center [&>circle]:[transform-box:fill-box] [&>circle]:[transform:scale(var(--ping,1))]";

// The Emblem of the Tier reached, as the Or → Platine artboard assembles it, 320 px: its six
// triangles fly in and meet in a blinding white, with a flash along their seams and of its shape;
// it lands, its full Aura lighting up from behind (under the wings and the metal, never over
// them), each stud pops in with a ring, its wings unfurl feather by feather, its star is traced,
// then cut, and a light sweeps over the metal. Only seen: the name under it says the Tier. The
// wrappers move, never the drawing.
export const TierUpAssembledEmblem = ({ tier }: { tier: Tier }) => {
  const { d } = EMBLEM_OUTLINES[tier];
  const { body, engraving } = EMBLEM_LAYERS[tier];
  const paint = tierUpPaint(tier);

  return (
    <div
      data-tier-up="emblem"
      data-tier={tier}
      aria-hidden
      className="absolute top-[190px] left-[560px] size-[320px]"
    >
      {/* Its body drawn once more over the Aura's canvas, hidden under the one assembled: only
          the Aura's light shows, from the impact on. */}
      <div data-tier-up="aura" className="absolute inset-0 opacity-0">
        <AuraFrame tier={tier} aura="full" Drawing={TierUpEmblemBody} />
      </div>
      <TierUpWings tier={tier} />
      {PLATINE_TRIANGLES.map(({ clip: cut }, index) => (
        <div
          key={cut}
          data-tier-up="triangle"
          data-index={index}
          className="absolute inset-0 opacity-0"
          style={{ clipPath: cut }}
        >
          <svg viewBox="0 0 32 32" className={LAYER}>
            {body}
          </svg>
        </div>
      ))}
      <svg viewBox="0 0 32 32" className={LAYER}>
        <g data-tier-up="body" opacity={0}>
          {body}
        </g>
        <path
          data-tier-up="seams"
          d={SEAMS}
          fill="none"
          stroke={paint.flash}
          strokeWidth={0.35}
          opacity={0}
        />
        <path
          data-tier-up="star-trace"
          d={STAR}
          transform="translate(0 0.6)"
          fill="none"
          stroke={paint.flash}
          strokeWidth={0.35}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
        <g data-tier-up="engraving" className={POPPED_STUDS}>
          {engraving}
        </g>
        <g data-tier-up="pings" className={PINGED}>
          {PLATINE_STUDS.map(([cx, cy]) => (
            <circle
              key={`${cx} ${cy}`}
              cx={cx}
              cy={cy}
              r={1}
              fill="none"
              stroke={paint.flash}
              strokeWidth={0.3}
            />
          ))}
        </g>
        <TierUpSheenBand tier={tier} d={d} />
        <path data-tier-up="flash" d={d} fill={paint.flash} opacity={0} />
      </svg>
    </div>
  );
};
