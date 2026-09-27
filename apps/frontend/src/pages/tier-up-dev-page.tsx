import { FpsCounter } from "@/components/aura-gallery/fps-counter";
import { TierUpDevBench } from "@/components/tier-up-dev/tier-up-dev-bench";

// Out of the production build: every Tier-up, played one at a time on made-up ranks, to tune each
// choreography against its artboard, the frame rate always in sight, over the Tier-up too.
export const TierUpDevPage = () => (
  <div className="flex flex-col gap-8 py-8">
    <h1 className="text-2xl font-extrabold">Tier-up</h1>
    <TierUpDevBench />
    <FpsCounter />
  </div>
);
