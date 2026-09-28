import type { KeystrokeParams } from "@/components/aura-maniac-prototype/keystroke-prototype";
import { PrototypeAvatar } from "@/components/aura-maniac-prototype/prototype-avatar";
import { PrototypeFullAura } from "@/components/aura-maniac-prototype/prototype-full-aura";
import { TierBlason } from "@/components/tier/drawing/tier-blason";
import { TierBlasonDrawing } from "@/components/tier/drawing/tier-blason-drawing";
import { TierOrnamentDrawing } from "@/components/tier/drawing/tier-ornament-drawing";

type PrototypeFullSectionProps = { params: KeystrokeParams; frozen: boolean };

// PROTOTYPE, throwaway: the full Aura where the app shows it large (Tier-up's Blason, Profile,
// Face-off), each on its own phase, beside today's fire for comparison.
export const PrototypeFullSection = ({ params, frozen }: PrototypeFullSectionProps) => (
  <section className="flex flex-col gap-10">
    <h2 className="text-xl font-extrabold">Aura pleine</h2>
    <div className="flex flex-wrap items-center gap-24 p-24">
      <figure className="flex flex-col items-center gap-16">
        <div className="size-[420px]">
          <PrototypeFullAura params={params} offset={0} frozen={frozen}>
            <TierBlasonDrawing tier="maniac" glow={false} />
          </PrototypeFullAura>
        </div>
        <figcaption className="text-text-secondary">Tier-up, ondes de frappe</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-16">
        <div className="size-[420px]">
          <TierBlason tier="maniac" aura="full" />
        </div>
        <figcaption className="text-text-secondary">Tier-up, le feu actuel</figcaption>
      </figure>
    </div>
    <div className="flex flex-wrap items-center gap-32 p-16">
      <figure className="flex flex-col items-center gap-8">
        <PrototypeAvatar box="size-32" avatar="size-16">
          <PrototypeFullAura params={params} offset={1.3} frozen={frozen}>
            <TierOrnamentDrawing tier="maniac" glow={false} />
          </PrototypeFullAura>
        </PrototypeAvatar>
        <figcaption className="text-text-secondary">Profile</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-8">
        <PrototypeAvatar box="size-88" avatar="size-44">
          <PrototypeFullAura params={params} offset={2.7} frozen={frozen}>
            <TierOrnamentDrawing tier="maniac" glow={false} />
          </PrototypeFullAura>
        </PrototypeAvatar>
        <figcaption className="text-text-secondary">Face-off</figcaption>
      </figure>
    </div>
  </section>
);
