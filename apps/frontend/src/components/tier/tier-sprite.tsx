import { TierEmblemSymbols } from "@/components/tier/tier-emblem-symbols";
import { TierOrnamentSymbols } from "@/components/tier/tier-ornament-symbols";
import { TierSpriteDefs } from "@/components/tier/tier-sprite-defs";

// The drawings of every Emblem and Ornament, mounted once in the root layout: `TierEmblem`,
// `TierOrnament` and `TierBlason` only point at them, so their ids exist once however many show.
// Out of the flow and never read; not `display: none`, which would drop its gradients.
export const TierSprite = () => (
  <svg width="0" height="0" className="absolute" aria-hidden>
    <TierSpriteDefs />
    <TierEmblemSymbols />
    <TierOrnamentSymbols />
  </svg>
);
