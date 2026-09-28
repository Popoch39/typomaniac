import { useId } from "react";

import { ThemePreview } from "@/components/theme/theme-preview";
import { ThemeRoles } from "@/components/theme/theme-roles";
import type { Theme } from "@/components/theme/themes";

type ThemeOptionProps = {
  name: string;
  theme: Theme;
  checked: boolean;
  onChoose: () => void;
};

// One Theme of the picker, a native radio (arrow keys and focus for free) under its card. The card
// sits under the Theme's own `data-theme`, so it is painted in its colours whatever the page's:
// its preview, its name, what it is, its two colours. Named by its name, described by its sentence.
export const ThemeOption = ({ name, theme, checked, onChoose }: ThemeOptionProps) => {
  const nameId = useId();
  const descriptionId = useId();

  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={theme.id}
        checked={checked}
        onChange={onChoose}
        aria-labelledby={nameId}
        aria-describedby={descriptionId}
        className="peer sr-only"
      />
      <span
        data-theme={theme.id}
        className="flex h-full flex-col gap-3.5 rounded-card bg-card p-2.5 pb-4 text-foreground ring-1 ring-border transition-shadow peer-checked:ring-3 peer-checked:ring-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-ring/50"
      >
        <ThemePreview />
        <span className="flex flex-col gap-1.5 px-1.5">
          <span className="flex min-h-5.5 items-center gap-2">
            <span id={nameId} className="text-base font-bold">
              {theme.name}
            </span>
            {checked ? (
              <span className="rounded-full bg-primary px-2.25 py-0.75 text-[11px] font-bold text-primary-foreground">
                Actif
              </span>
            ) : null}
          </span>
          <span
            id={descriptionId}
            className="min-h-9 text-[12.5px] leading-[1.4] text-muted-foreground"
          >
            {theme.description}
          </span>
          <ThemeRoles />
        </span>
      </span>
    </label>
  );
};
