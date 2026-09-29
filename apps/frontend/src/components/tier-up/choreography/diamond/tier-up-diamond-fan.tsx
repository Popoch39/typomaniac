import { UNFURLED } from "@/components/tier-up/parts/tier-up-feathers";
import { FEATHER_ID, LINE, ref } from "@/components/tier/sprite/tier-sprite-paint";
import { DIAMOND_FANS } from "@/components/tier/sprite/tier-wing-fans";

type TierUpDiamondFanProps = { fan: keyof typeof DIAMOND_FANS; fill: string };

// The feathers of one fan of the Diamond's wing, in the sprite's order, each unseen until it
// unfurls from its root.
export const TierUpDiamondFan = ({ fan, fill }: TierUpDiamondFanProps) =>
  DIAMOND_FANS[fan].map(([turn], index) => (
    <g
      key={turn}
      data-tier-up="feather"
      data-fan={fan}
      data-index={index}
      className={UNFURLED}
      opacity={0}
    >
      <use href={ref(FEATHER_ID)} fill={fill} {...LINE} />
    </g>
  ));
