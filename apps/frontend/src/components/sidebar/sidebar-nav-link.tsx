import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { RailTooltip } from "@/components/sidebar/rail-tooltip";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

type SidebarNavLinkProps = Pick<LinkComponentProps, "to" | "activeOptions"> & {
  icon: LucideIcon;
  label: string;
  // After the label, inside the link: a count, as the Friend requests'. On the icon in the Rail.
  badge?: ReactNode;
  // Under the label in the Rail's tooltip: what the badge says, as the wait in the Queue.
  hint?: ReactNode;
};

// One entry of the sidebar's nav: a link to a page, its icon then its name. The router's Link sets
// `aria-current="page"` on the current one, which fills it with the accent. One of the items the
// Intro brings in after the sidebar. In the Rail, the icon alone, its name kept for screen readers
// and written in a tooltip.
export const SidebarNavLink = ({
  to,
  activeOptions,
  icon: Icon,
  label,
  badge,
  hint,
}: SidebarNavLinkProps) => (
  <SidebarMenuItem data-intro="nav">
    <RailTooltip
      label={
        <span className="flex flex-col">
          {label}
          {hint}
        </span>
      }
    >
      <SidebarMenuButton render={<Link to={to} activeOptions={activeOptions} />}>
        <Icon aria-hidden="true" />
        <span className="rail:sr-only">{label}</span>
        {badge}
      </SidebarMenuButton>
    </RailTooltip>
  </SidebarMenuItem>
);
