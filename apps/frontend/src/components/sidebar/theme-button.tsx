import { Link } from "@tanstack/react-router";
import { PaletteIcon } from "lucide-react";

import { RailTooltip } from "@/components/sidebar/rail-tooltip";
import { themeName } from "@/components/theme/theme-text";
import { useActiveTheme } from "@/components/theme/use-active-theme";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// At the bottom of the sidebar, the way to the Themes: the name of the Theme in use and its two
// colours, the accent (Toi) then the opponent's. Marked as the current page on /themes, in the
// surface's colour rather than the nav's accent. In the Rail, the icon, the Theme named in its
// tooltip.
export const ThemeButton = () => {
  const theme = useActiveTheme();
  const locale = useLocale();
  const name = themeName(theme.id, locale);

  return (
    <RailTooltip label={m.sidebar_theme_named({ name }, { locale })}>
      <SidebarMenuButton
        render={<Link to="/themes" />}
        className="gap-2.5 rounded-2xl pr-3 text-sm aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-accent-foreground rail:rounded-full [&_svg]:size-4.5"
      >
        <PaletteIcon aria-hidden="true" />
        <span className="rail:sr-only">{m.sidebar_theme({}, { locale })}</span>
        <span className="ml-auto flex items-center gap-2 text-foreground rail:sr-only">
          {name}
          <span aria-hidden="true" className="flex">
            <span className="size-3 rounded-full bg-brand ring-2 ring-sidebar" />
            <span className="-ml-0.75 size-3 rounded-full bg-opponent ring-2 ring-sidebar" />
          </span>
        </span>
      </SidebarMenuButton>
    </RailTooltip>
  );
};
