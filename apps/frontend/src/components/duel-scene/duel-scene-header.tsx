import { BrandMark } from "@/components/brand/brand-mark";
import type { DuelFormat } from "@/components/duel/duel-format-line";
import { DuelFormatChip } from "@/components/duel-scene/duel-format-chip";

// Atop the Duel's scene, in place of the sidebar: the Logo and the Duel's format, faded and inert
// so that a stray click never leaves the Duel.
export const DuelSceneHeader = ({ format }: { format: DuelFormat }) => (
  <header inert className="flex h-11 items-center justify-between opacity-38">
    <BrandMark />
    <DuelFormatChip format={format} />
  </header>
);
