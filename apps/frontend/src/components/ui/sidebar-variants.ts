import { cva } from "class-variance-authority";

// Split out of sidebar.tsx so that file only exports components (react/only-export-components).
// Social style: a 44px pill per entry, the current page's (`aria-current="page"`, set by the
// router's Link) filled with the accent.
export const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button flex h-11 w-full items-center gap-3 overflow-hidden rounded-full px-3.5 text-left text-[15px] font-semibold text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-sidebar-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-[current=page]:bg-sidebar-primary aria-[current=page]:font-bold aria-[current=page]:text-sidebar-primary-foreground [&_svg]:size-5 [&_svg]:shrink-0",
);
