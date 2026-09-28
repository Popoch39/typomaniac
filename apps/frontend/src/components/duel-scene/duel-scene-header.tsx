import { BrandMark } from "@/components/brand-mark";
import { DuelFormatChip } from "@/components/duel-scene/duel-format-chip";

// Atop the Duel's scene, in place of the sidebar: the brand and the Duel's format, faded and inert
// so that a stray click never leaves the Duel.
export const DuelSceneHeader = ({ challenge }: { challenge: boolean }) => (
  <header inert className="flex h-11 items-center justify-between opacity-38">
    <BrandMark />
    <DuelFormatChip challenge={challenge} />
  </header>
);
