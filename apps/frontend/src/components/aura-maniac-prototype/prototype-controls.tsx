import {
  CADENCE_NAMES,
  type CadenceName,
  type KeystrokeParams,
  PRESETS,
} from "@/components/aura-maniac-prototype/keystroke-prototype";
import { PrototypeSlider } from "@/components/aura-maniac-prototype/prototype-slider";
import { Button } from "@/components/ui/button";

type Tunable = Exclude<keyof KeystrokeParams, "cadence">;

const SLIDERS: readonly { key: Tunable; label: string; min: number; max: number; step: number }[] =
  [
    { key: "life", label: "Durée d'une onde (s)", min: 0.5, max: 3, step: 0.05 },
    { key: "birth", label: "Naissance (rayon)", min: 0.3, max: 0.6, step: 0.01 },
    { key: "reach", label: "Portée (rayon)", min: 0.6, max: 1, step: 0.01 },
    { key: "curve", label: "Freinage", min: 1, max: 4, step: 0.1 },
    { key: "thickness", label: "Épaisseur", min: 0.004, max: 0.05, step: 0.001 },
    { key: "trail", label: "Traîne", min: 0, max: 0.5, step: 0.01 },
    { key: "halo", label: "Halo au repos", min: 0, max: 1, step: 0.01 },
    { key: "flash", label: "Flash par frappe", min: 0, max: 1.5, step: 0.01 },
    { key: "flashDecay", label: "Retombée du flash (s)", min: 0.05, max: 0.8, step: 0.01 },
    { key: "lightLife", label: "Légère : durée d'un anneau (s)", min: 0.3, max: 2, step: 0.05 },
    { key: "lightScale", label: "Légère : portée", min: 1.1, max: 1.8, step: 0.01 },
    { key: "lightWidth", label: "Légère : trait", min: 0.4, max: 3, step: 0.1 },
  ];

const CADENCE_LABELS: Record<CadenceName, string> = {
  sober: "Sobre",
  typist: "Dactylo",
  frantic: "Frénétique",
};

type PrototypeControlsProps = {
  params: KeystrokeParams;
  frozen: boolean;
  onParams: (params: KeystrokeParams) => void;
  onFrozen: (frozen: boolean) => void;
};

// PROTOTYPE, throwaway: presets, cadence, every tunable value, reduced motion, and the values
// themselves to copy back.
export const PrototypeControls = ({
  params,
  frozen,
  onParams,
  onFrozen,
}: PrototypeControlsProps) => (
  <aside className="sticky top-4 flex w-80 shrink-0 flex-col gap-4 self-start rounded-card bg-surface p-6">
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-bold">Préréglages</legend>
      <div className="flex gap-2">
        {CADENCE_NAMES.map((name) => (
          <Button key={name} variant="outline" onClick={() => onParams(PRESETS[name])}>
            {CADENCE_LABELS[name]}
          </Button>
        ))}
      </div>
    </fieldset>
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-bold">Cadence seule</legend>
      <div className="flex gap-2">
        {CADENCE_NAMES.map((name) => (
          <Button
            key={name}
            variant="outline"
            aria-pressed={params.cadence === name}
            onClick={() => onParams({ ...params, cadence: name })}
          >
            {CADENCE_LABELS[name]}
          </Button>
        ))}
      </div>
    </fieldset>
    {SLIDERS.map(({ key, label, min, max, step }) => (
      <PrototypeSlider
        key={key}
        label={label}
        value={params[key]}
        min={min}
        max={max}
        step={step}
        onChange={(value) => onParams({ ...params, [key]: value })}
      />
    ))}
    <Button variant="outline" aria-pressed={frozen} onClick={() => onFrozen(!frozen)}>
      Animations réduites
    </Button>
    <pre className="overflow-x-auto rounded-xl bg-ink p-3 font-mono text-xs">
      {JSON.stringify(params, null, 2)}
    </pre>
  </aside>
);
