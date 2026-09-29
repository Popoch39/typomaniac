import { useLocale } from "@/locale/use-locale";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// What a Theme changes, and what it leaves alone.
const EFFECTS = [
  {
    key: "surfaces",
    title: (locale: Locale) => m.themes_effect_surfaces_title({}, { locale }),
    text: (locale: Locale) => m.themes_effect_surfaces_text({}, { locale }),
  },
  {
    key: "accent",
    title: (locale: Locale) => m.themes_effect_accent_title({}, { locale }),
    text: (locale: Locale) => m.themes_effect_accent_text({}, { locale }),
  },
  {
    key: "opponent",
    title: (locale: Locale) => m.themes_effect_opponent_title({}, { locale }),
    text: (locale: Locale) => m.themes_effect_opponent_text({}, { locale }),
  },
  {
    key: "tiers",
    title: (locale: Locale) => m.themes_effect_tiers_title({}, { locale }),
    text: (locale: Locale) => m.themes_effect_tiers_text({}, { locale }),
  },
] as const;

// Under the Themes: what choosing one changes.
export const ThemeEffects = () => {
  const locale = useLocale();

  return (
    <section
      aria-label={m.themes_effects_label({}, { locale })}
      className="grid grid-cols-4 gap-5 px-1.5 pt-1"
    >
      {EFFECTS.map((effect) => (
        <div key={effect.key} className="flex flex-col gap-1.5">
          <h2 className="font-mono text-[0.66rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            {effect.title(locale)}
          </h2>
          <p className="text-[13px] leading-normal">{effect.text(locale)}</p>
        </div>
      ))}
    </section>
  );
};
