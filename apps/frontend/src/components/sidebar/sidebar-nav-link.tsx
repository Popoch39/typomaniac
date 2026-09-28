import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

type SidebarNavLinkProps = Pick<LinkComponentProps, "to" | "activeOptions"> & {
  icon: LucideIcon;
  label: string;
  // After the label, inside the link: a count, as the Friend requests'.
  badge?: ReactNode;
};

// One entry of the sidebar's nav: a link to a page, its icon then its name. The router's Link sets
// `aria-current="page"` on the current one, which fills it with the accent.
export const SidebarNavLink = ({
  to,
  activeOptions,
  icon: Icon,
  label,
  badge,
}: SidebarNavLinkProps) => (
  <SidebarMenuItem>
    <SidebarMenuButton render={<Link to={to} activeOptions={activeOptions} />}>
      <Icon aria-hidden="true" />
      {label}
      {badge}
    </SidebarMenuButton>
  </SidebarMenuItem>
);
