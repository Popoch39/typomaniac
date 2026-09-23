import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme-store";

export const ThemeToggle = () => {
  const isDark = useThemeStore((state) => state.theme === "dark");
  const toggle = useThemeStore((state) => state.toggle);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
};
