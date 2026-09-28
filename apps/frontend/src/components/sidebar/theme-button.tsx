import { Link } from "@tanstack/react-router";
import { PaletteIcon } from "lucide-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";

// The one Theme for now: the Themes to choose from come with their page.
const THEME_NAME = "Corail";

// At the bottom of the sidebar, the way to the Themes: the name of the Theme in use and its two
// colours, the accent (Toi) then the opponent's. Marked as the current page on /themes, in the
// surface's colour rather than the nav's accent.
export const ThemeButton = () => (
  <SidebarMenuButton
    render={<Link to="/themes" />}
    className="gap-2.5 rounded-2xl pr-3 text-sm aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-accent-foreground [&_svg]:size-4.5"
  >
    <PaletteIcon aria-hidden="true" />
    Thème
    <span className="ml-auto flex items-center gap-2 text-foreground">
      {THEME_NAME}
      <span aria-hidden="true" className="flex">
        <span className="size-3 rounded-full bg-brand ring-2 ring-sidebar" />
        <span className="-ml-0.75 size-3 rounded-full bg-opponent ring-2 ring-sidebar" />
      </span>
    </span>
  </SidebarMenuButton>
);
