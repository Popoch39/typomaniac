import { themeName } from "@/components/theme/theme-text";
import { useActiveTheme } from "@/components/theme/use-active-theme";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The name of the Theme in use, in the header of the Themes page.
export const ActiveTheme = () => {
  const theme = useActiveTheme();
  const locale = useLocale();

  return (
    <p className="flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-muted-foreground">
      {withSlots((marks) => m.themes_active(marks, { locale }), {
        name: <span className="font-bold text-foreground">{themeName(theme.id, locale)}</span>,
      })}
    </p>
  );
};
