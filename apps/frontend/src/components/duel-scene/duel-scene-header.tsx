import { BrandMark } from "@/components/brand/brand-mark";
import type { DuelFormat } from "@/components/duel/duel-format-line";
import { DuelFormatChip } from "@/components/duel-scene/duel-format-chip";
import { DuelRoundTracker } from "@/components/duel-scene/duel-round-tracker";
import type { DuelRoundView } from "@/components/duel-scene/duel-round-view";

type DuelSceneHeaderProps = {
  format: DuelFormat;
  // In a Bo3, where it stands; null for a Duel of a single Round.
  round: DuelRoundView | null;
};

// Atop the Duel's scene, in place of the sidebar: the Logo and the Duel's format, faded, and in a
// Bo3 the Round being played and the Rounds won, beside the format, to read at a glance. Inert,
// so that a stray click never leaves the Duel.
export const DuelSceneHeader = ({ format, round }: DuelSceneHeaderProps) => (
  <header inert className="flex h-11 items-center justify-between">
    <div className="opacity-38">
      <BrandMark />
    </div>
    <div className="flex items-center gap-2.5">
      {round === null ? null : <DuelRoundTracker view={round} />}
      <div className="opacity-38">
        <DuelFormatChip format={format} />
      </div>
    </div>
  </header>
);
