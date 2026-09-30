import type { ReactElement, ReactNode } from "react";

import { useSidebarRail } from "@/components/sidebar/use-sidebar-rail";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type RailTooltipProps = {
  // What the Rail no longer writes beside the entry.
  label: ReactNode;
  // The entry itself, which the tooltip names on hover and focus.
  children: ReactElement;
};

// In the Rail, an entry's name on its right, as it no longer fits beside the icon. The whole
// sidebar writes it already: no tooltip there.
export const RailTooltip = ({ label, children }: RailTooltipProps) => {
  const rail = useSidebarRail();

  return rail ? (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ) : (
    children
  );
};
