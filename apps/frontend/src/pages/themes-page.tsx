import { PageHeader } from "@/components/page-header";
import { ActiveTheme } from "@/components/theme/active-theme";
import { ThemeEffects } from "@/components/theme/theme-effects";
import { ThemePicker } from "@/components/theme/theme-picker";

// The choice of the Theme, for a User as for a Visitor: each one shown in its own colours.
export const ThemesPage = () => (
  <section className="flex flex-col gap-6.5">
    <PageHeader
      title="Thèmes"
      subtitle="Choisis tes couleurs. Un Theme change le fond, l'accent et la couleur de l'adversaire, jamais la place des choses."
      actions={<ActiveTheme />}
    />
    <ThemePicker />
    <ThemeEffects />
  </section>
);
