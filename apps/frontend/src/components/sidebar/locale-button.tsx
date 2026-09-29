import { cn } from "cn";
import { LanguagesIcon } from "lucide-react";

import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { LOCALE_NAMES, type Locale, otherLocale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { useSwitchLocale } from "@/locale/use-switch-locale";
import { m } from "@/paraglide/messages";

// FR / EN, in this order whatever the Locale.
const ORDER: readonly Locale[] = ["fr", "en"];

// At the bottom of the sidebar, FR / EN: « Français » and « English », each in its own language,
// the one shown standing out. A click switches to the other one, on the same page. Disabled from
// the Countdown to the end of the Duel: nothing may disturb the typing.
export const LocaleButton = () => {
  const locale = useLocale();
  const switchLocale = useSwitchLocale();
  const inDuel = useInDuelScene();
  const next = otherLocale(locale);

  return (
    <SidebarMenuButton
      onClick={() => switchLocale(next)}
      disabled={inDuel}
      aria-label={m.sidebar_locale_label(
        { current: LOCALE_NAMES[locale], next: LOCALE_NAMES[next] },
        { locale },
      )}
      className="gap-2.5 rounded-2xl pr-3 text-sm [&_svg]:size-4.5"
    >
      <LanguagesIcon aria-hidden="true" />
      <span className="flex gap-2">
        {ORDER.map((code) => (
          <span
            key={code}
            lang={code}
            className={cn(code === locale ? "text-foreground" : "font-medium text-faint")}
          >
            {LOCALE_NAMES[code]}
          </span>
        ))}
      </span>
    </SidebarMenuButton>
  );
};
