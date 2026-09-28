import { BrandMark } from "@/components/brand-mark";
import { SidebarAccount } from "@/components/sidebar/sidebar-account";
import { SidebarNav } from "@/components/sidebar/sidebar-nav";
import { SidebarOnlineFriends } from "@/components/sidebar/sidebar-online-friends";
import { ThemeButton } from "@/components/sidebar/theme-button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";

type AppSidebarProps = {
  // In the Duel's scene: out of sight and out of reach, never unmounted.
  hidden: boolean;
  // While a Solo Run is typed: faded, and out of reach so that nothing takes the focus.
  faded: boolean;
};

// The floating sidebar, left of every page, the window's height: the brand, the nav, the Friends
// online, then the Theme button and the User's card (or the Visitor's).
export const AppSidebar = ({ hidden, faded }: AppSidebarProps) => (
  <Sidebar
    aria-label="Barre latérale"
    hidden={hidden}
    inert={hidden || faded}
    data-faded={faded ? "" : undefined}
    className="sticky top-3 h-[calc(100svh-1.5rem)] px-3 pt-4.5 pb-3 transition-opacity duration-300 data-faded:opacity-30"
  >
    <SidebarHeader className="px-2.5 pt-0.5 pb-4.5">
      <BrandMark />
    </SidebarHeader>
    <SidebarContent>
      <SidebarNav />
      <SidebarOnlineFriends />
    </SidebarContent>
    <SidebarFooter>
      <ThemeButton />
      <SidebarAccount />
    </SidebarFooter>
  </Sidebar>
);
