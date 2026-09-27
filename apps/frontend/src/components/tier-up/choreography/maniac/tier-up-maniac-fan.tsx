import { SWAYING } from "@/components/tier-up/parts/tier-up-feathers";
import { FEATHER_ID, LINE, ref } from "@/components/tier/sprite/tier-sprite-paint";
import { MANIAC_FANS } from "@/components/tier/sprite/tier-wing-fans";

type TierUpManiacFanProps = { fan: keyof typeof MANIAC_FANS; fill: string };

// The feathers of one fan of the Maniac's wing, in the sprite's order, each unseen until it
// spreads from its root, then swaying on its own.
export const TierUpManiacFan = ({ fan, fill }: TierUpManiacFanProps) =>
  MANIAC_FANS[fan].map(([turn], index) => (
    <g
      key={turn}
      data-tier-up="feather"
      data-fan={fan}
      data-index={index}
      className={SWAYING}
      opacity={0}
    >
      <use href={ref(FEATHER_ID)} fill={fill} {...LINE} />
    </g>
  ));
