import { useState } from "react";

import { FpsCounter } from "@/components/aura-gallery/fps-counter";
import { PRESETS } from "@/components/aura-maniac-prototype/keystroke-prototype";
import { PrototypeControls } from "@/components/aura-maniac-prototype/prototype-controls";
import { PrototypeGpuBenchPanel } from "@/components/aura-maniac-prototype/prototype-gpu-bench-panel";
import { PrototypeFullSection } from "@/components/aura-maniac-prototype/prototype-full-section";
import { PrototypeLightSection } from "@/components/aura-maniac-prototype/prototype-light-section";

// PROTOTYPE, throwaway: the Maniac's Aura as keystroke waves, tuned live. The values chosen move
// into the real Aura, then this page and its folder go.
export const AuraManiacPrototypePage = () => {
  const [params, setParams] = useState(PRESETS.typist);
  const [frozen, setFrozen] = useState(false);

  return (
    <div className="flex gap-8 py-8">
      <PrototypeControls
        params={params}
        frozen={frozen}
        onParams={setParams}
        onFrozen={setFrozen}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-12">
        <h1 className="text-2xl font-extrabold">Aura du Maniac : ondes de frappe (prototype)</h1>
        <PrototypeFullSection params={params} frozen={frozen} />
        <PrototypeLightSection params={params} frozen={frozen} />
        <PrototypeGpuBenchPanel />
      </div>
      <FpsCounter />
    </div>
  );
};
