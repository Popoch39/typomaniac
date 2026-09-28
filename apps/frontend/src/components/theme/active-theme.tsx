import { useActiveTheme } from "@/components/theme/use-active-theme";

// The name of the Theme in use, in the header of the Themes page.
export const ActiveTheme = () => {
  const theme = useActiveTheme();

  return (
    <p className="flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-muted-foreground">
      Actif <span className="font-bold text-foreground">{theme.name}</span>
    </p>
  );
};
