import { Link, type LinkComponentProps } from "@tanstack/react-router";

// TanStack Link sets aria-current="page" on the current route: the active pill reads it.
const navPillClassName =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground";

// One segment of NavPills: a link to a page, filled with the accent when it is the current one.
export const NavPill = (props: Omit<LinkComponentProps, "className">) => (
  <li>
    <Link {...props} className={navPillClassName} />
  </li>
);
