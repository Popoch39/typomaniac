import { useRef } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { LocaleButton } from "@/components/sidebar/locale-button";
import { SidebarAccount } from "@/components/sidebar/sidebar-account";
import { SidebarNav } from "@/components/sidebar/sidebar-nav";
import { SidebarOnlineFriends } from "@/components/sidebar/sidebar-online-friends";
import { ThemeButton } from "@/components/sidebar/theme-button";
import { useSidebarRail } from "@/components/sidebar/use-sidebar-rail";
import { useSidebarRetreat } from "@/components/sidebar/use-sidebar-retreat";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type AppSidebarProps = {
  // In the Duel's scene: out of sight and out of reach, never unmounted.
  hidden: boolean;
  // While a Solo Run is typed: out of the window, the page on its whole width, and out of reach so
  // that nothing takes the focus.
  retreated: boolean;
};

// The floating sidebar, left of every page, the window's height: the Logo, the nav, the Friends
// online, then the Locale switch, the Theme button and the User's card (or the Visitor's). The
// Intro lands in it: it grows from its brand, its foot coming last. Below 1440 px, its Rail: the
// same entries, icons named in tooltips (useSidebarRail).
export const AppSidebar = ({ hidden, retreated }: AppSidebarProps) => {
  const locale = useLocale();
  const rail = useSidebarRail();
  const sidebarRef = useRef<HTMLElement>(null);

  useSidebarRetreat(sidebarRef, retreated);

  return (
    <TooltipProvider>
      <Sidebar
        ref={sidebarRef}
        data-intro="sidebar"
        aria-label={m.sidebar_label({}, { locale })}
        hidden={hidden}
        inert={hidden || retreated}
        data-retreated={retreated ? "" : undefined}
        data-rail={rail ? "" : undefined}
        className="sticky top-3 h-[calc(100svh-1.5rem)] px-3 pt-4.5 pb-3 rail:w-17"
      >
        {/* 4 px less on the left than on the right: the symbol has its own margin. */}
        <SidebarHeader className="pt-0.5 pr-2.5 pb-4.5 pl-1.5 rail:items-center rail:px-0">
          <BrandMark />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
          <SidebarOnlineFriends />
        </SidebarContent>
        <SidebarFooter data-intro="foot">
          <LocaleButton />
          <ThemeButton />
          <SidebarAccount />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
};
