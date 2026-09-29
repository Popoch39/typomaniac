import { PageHeader } from "@/components/page-header";
import { ActiveTheme } from "@/components/theme/active-theme";
import { ThemeEffects } from "@/components/theme/theme-effects";
import { ThemePicker } from "@/components/theme/theme-picker";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The choice of the Theme, for a User as for a Visitor: each one shown in its own colours.
export const ThemesPage = () => {
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-6.5">
      <PageHeader
        title={m.themes_title({}, { locale })}
        subtitle={m.themes_subtitle({}, { locale })}
        actions={<ActiveTheme />}
      />
      <ThemePicker />
      <ThemeEffects />
    </section>
  );
};
