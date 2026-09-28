import { useId } from "react";

import { ThemeOption } from "@/components/theme/theme-option";
import { THEMES } from "@/components/theme/themes";
import { useThemeStore } from "@/stores/theme-store";

// The Themes, four to a row, by mouse or arrow keys: the one chosen applies to the whole app at
// once, without a button to confirm it.
export const ThemePicker = () => {
  const chosen = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const name = useId();

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="grid grid-cols-4 gap-5">
        {THEMES.map((theme) => (
          <ThemeOption
            key={theme.id}
            name={name}
            theme={theme}
            checked={theme.id === chosen}
            onChoose={() => setTheme(theme.id)}
          />
        ))}
      </div>
    </fieldset>
  );
};
