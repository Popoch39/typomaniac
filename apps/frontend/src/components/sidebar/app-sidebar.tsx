import { useRef } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { LocaleButton } from "@/components/sidebar/locale-button";
import { SidebarAccount } from "@/components/sidebar/sidebar-account";
import { SidebarNav } from "@/components/sidebar/sidebar-nav";
import { SidebarOnlineFriends } from "@/components/sidebar/sidebar-online-friends";
import { ThemeButton } from "@/components/sidebar/theme-button";
import { useSoloRunTyping } from "@/components/run/use-solo-run-typing";
import { useSidebarFold } from "@/components/sidebar/use-sidebar-fold";
import { useSidebarRail } from "@/components/sidebar/use-sidebar-rail";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type AppSidebarProps = {
  // In the Duel's scene: out of sight and out of reach, never unmounted.
  hidden: boolean;
};

// The floating sidebar, left of every page, the window's height: the Logo, the nav, the Friends
// online, then the Locale switch, the Theme button and the User's card (or the Visitor's). The
// Intro lands in it: it grows from its brand, its foot coming last. Below 1440 px, and while a Solo
// Run is typed, its Rail: the same entries, icons named in tooltips (useSidebarRail); the Run's
// typing folds it and unfolds it in a move (useSidebarFold).
export const AppSidebar = ({ hidden }: AppSidebarProps) => {
  const locale = useLocale();
  const rail = useSidebarRail();
  const typing = useSoloRunTyping();
  const sidebarRef = useRef<HTMLElement>(null);

  useSidebarFold(sidebarRef, rail, typing);

  return (
    <TooltipProvider>
      <Sidebar
        ref={sidebarRef}
        data-intro="sidebar"
        aria-label={m.sidebar_label({}, { locale })}
        hidden={hidden}
        inert={hidden}
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
