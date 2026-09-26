import { type ComponentType, useState } from "react";
import type { Tier } from "ranked";

import { FullAuraCanvas } from "@/components/aura/full-aura-canvas";

// The svg of an Ornament of `tier`, with or without its glow.
export type OrnamentDrawing = ComponentType<{ tier: Tier; glow: boolean }>;

type FullAuraFrameProps = { tier: Tier; Drawing: OrnamentDrawing };

// The Ornament's drawing over its full Aura's canvas, without its glow: the shader draws its own
// light. Refused or lost, the drawing alone with its glow: the light Aura, which never tries again.
export const FullAuraFrame = ({ tier, Drawing }: FullAuraFrameProps) => {
  const [refused, setRefused] = useState(false);

  if (refused) {
    return <Drawing tier={tier} glow />;
  }

  return (
    <span className="relative isolate block size-full">
      <FullAuraCanvas tier={tier} onRefused={() => setRefused(true)} />
      <Drawing tier={tier} glow={false} />
    </span>
  );
};
