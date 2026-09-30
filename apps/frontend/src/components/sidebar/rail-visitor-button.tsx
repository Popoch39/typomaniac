import { LogInIcon } from "lucide-react";

import { RailTooltip } from "@/components/sidebar/rail-tooltip";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useAuthStore } from "@/stores/auth-store";

// At the bottom of a Visitor's Rail, in place of their card: the way to the sign-in dialog, an
// icon named in its tooltip.
export const RailVisitorButton = () => {
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);
  const locale = useLocale();
  const label = m.sidebar_visitor_sign_in({}, { locale });

  return (
    <RailTooltip label={label}>
      <SidebarMenuButton
        onClick={() => setSignInOpen(true)}
        className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
      >
        <LogInIcon aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </SidebarMenuButton>
    </RailTooltip>
  );
};
