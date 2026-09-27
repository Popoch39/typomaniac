import { FIRE, MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import type { TierUpMote } from "@/components/tier-up/parts/mote-rise";

type TierUpEmbersProps = {
  // Their name for the timeline: each set of embers rises in its own time.
  name: string;
  embers: readonly TierUpMote[];
};

// Embers rising from under the stage, each a glowing dot of fire, unseen until it first rises.
export const TierUpEmbers = ({ name, embers }: TierUpEmbersProps) => (
  <div className="absolute inset-0">
    {embers.map(({ left, top, size }) => (
      <i
        key={`${left} ${top}`}
        data-tier-up={name}
        className="absolute rounded-full opacity-0"
        style={{
          left,
          top,
          width: size,
          height: size,
          background: FIRE.ember,
          boxShadow: MANIAC_PAINT.glow(10, 2),
        }}
      />
    ))}
  </div>
);
