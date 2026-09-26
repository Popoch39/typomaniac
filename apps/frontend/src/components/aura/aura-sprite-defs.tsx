import {
  SHEEN_ID,
  SHEEN_MASK_BOX,
  SHEEN_OPACITY,
  SHINING_TIERS,
  sheenMaskId,
} from "@/components/aura/aura-paint";
import { ornamentId, ref } from "@/components/tier/tier-sprite-paint";

// What the light Aura shares in the Tier sprite: the band of the sheen, and one mask per shining
// Tier cut to its Ornament. The mask reads the drawing's alpha, so the sheen covers the metal
// evenly and never spills onto the background.
export const AuraSpriteDefs = () => (
  <>
    <linearGradient id={SHEEN_ID} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#fff" stopOpacity={0} />
      <stop offset="0.5" stopColor="#fff" stopOpacity={SHEEN_OPACITY} />
      <stop offset="1" stopColor="#fff" stopOpacity={0} />
    </linearGradient>
    {SHINING_TIERS.map((tier) => (
      <mask
        key={tier}
        id={sheenMaskId(tier)}
        maskUnits="userSpaceOnUse"
        {...SHEEN_MASK_BOX}
        style={{ maskType: "alpha" }}
      >
        <use href={ref(ornamentId(tier))} width="120" height="120" />
      </mask>
    ))}
  </>
);
