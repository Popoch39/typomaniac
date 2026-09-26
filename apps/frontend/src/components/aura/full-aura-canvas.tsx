import { useRef } from "react";
import type { Tier } from "ranked";

import { useFullAura } from "@/components/aura/use-full-aura";

type FullAuraCanvasProps = { tier: Tier; onRefused: () => void };

// The canvas of one full Aura, behind the Ornament's drawing, centred on its box and half as large
// again, so the light spreads beyond the metal. Empty until the runtime draws on it.
export const FullAuraCanvas = ({ tier, onRefused }: FullAuraCanvasProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useFullAura(canvas, tier, onRefused);

  return (
    <canvas
      ref={canvas}
      data-aura-canvas
      aria-hidden
      className="pointer-events-none absolute -inset-1/4 -z-10 size-[150%]"
    />
  );
};
