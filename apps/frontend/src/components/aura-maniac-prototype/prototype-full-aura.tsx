import { type ReactNode, useRef } from "react";

import type { KeystrokeParams } from "@/components/aura-maniac-prototype/keystroke-prototype";
import { usePrototypeWaves } from "@/components/aura-maniac-prototype/use-prototype-waves";

type PrototypeFullAuraProps = {
  params: KeystrokeParams;
  offset: number;
  frozen: boolean;
  children: ReactNode;
};

// PROTOTYPE, throwaway: the drawing over its keystroke waves' canvas, half as large again as its
// box, as `FullAuraCanvas` lays it.
export const PrototypeFullAura = ({ params, offset, frozen, children }: PrototypeFullAuraProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  usePrototypeWaves(canvas, params, offset, frozen);

  return (
    <span className="relative isolate block size-full">
      <canvas
        ref={canvas}
        aria-hidden
        className="pointer-events-none absolute -inset-1/4 -z-10 size-[150%]"
      />
      {children}
    </span>
  );
};
