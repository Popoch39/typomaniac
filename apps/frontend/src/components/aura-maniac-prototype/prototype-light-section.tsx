import type { KeystrokeParams } from "@/components/aura-maniac-prototype/keystroke-prototype";
import { PrototypeAvatar } from "@/components/aura-maniac-prototype/prototype-avatar";
import { PrototypeLightAura } from "@/components/aura-maniac-prototype/prototype-light-aura";
import { TierBlasonDrawing } from "@/components/tier/drawing/tier-blason-drawing";
import { TierOrnamentDrawing } from "@/components/tier/drawing/tier-ornament-drawing";

type PrototypeLightSectionProps = { params: KeystrokeParams; frozen: boolean };

// Classement rows, each on its own phase: a list never pulses in step.
const ROW_OFFSETS = [0.4, 1.9, 3.1, 0.9, 2.5];

// PROTOTYPE, throwaway: the light Aura at the sizes of lists and badges, and a large one to read
// the rings.
export const PrototypeLightSection = ({ params, frozen }: PrototypeLightSectionProps) => (
  <section className="flex flex-col gap-10">
    <h2 className="text-xl font-extrabold">Aura légère</h2>
    <div className="flex flex-wrap items-center gap-20 p-12">
      <figure className="flex flex-col items-center gap-10">
        <div className="size-60">
          <PrototypeLightAura params={params} offset={0} frozen={frozen}>
            <TierBlasonDrawing tier="maniac" glow={false} />
          </PrototypeLightAura>
        </div>
        <figcaption className="text-text-secondary">En grand, pour lire les anneaux</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-6">
        <div className="size-24">
          <PrototypeLightAura params={params} offset={1.1} frozen={frozen}>
            <TierBlasonDrawing tier="maniac" glow={false} />
          </PrototypeLightAura>
        </div>
        <figcaption className="text-text-secondary">Badge de Tier</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-6">
        <PrototypeAvatar box="size-20" avatar="size-10 text-xs">
          <PrototypeLightAura params={params} offset={2.2} frozen={frozen}>
            <TierOrnamentDrawing tier="maniac" glow={false} />
          </PrototypeLightAura>
        </PrototypeAvatar>
        <figcaption className="text-text-secondary">Header</figcaption>
      </figure>
    </div>
    <ul className="flex w-96 flex-col gap-4 rounded-card bg-surface p-6">
      {ROW_OFFSETS.map((offset, index) => (
        <li key={offset} className="flex items-center gap-4">
          <span className="w-6 font-mono tabular-nums text-text-secondary">{index + 1}</span>
          <PrototypeAvatar box="size-18" avatar="size-9 text-xs">
            <PrototypeLightAura params={params} offset={offset} frozen={frozen}>
              <TierOrnamentDrawing tier="maniac" glow={false} />
            </PrototypeLightAura>
          </PrototypeAvatar>
          <span className="font-bold">maniac_{index + 1}</span>
        </li>
      ))}
    </ul>
  </section>
);
