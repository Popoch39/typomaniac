import { themeOf } from "@/components/theme/themes";
import { useThemeStore } from "@/stores/theme-store";

// The Theme in use, with its name, wherever it is shown.
export const useActiveTheme = () => themeOf(useThemeStore((state) => state.theme));
