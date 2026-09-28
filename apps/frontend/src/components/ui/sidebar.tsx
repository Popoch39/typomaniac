import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import type { ComponentProps } from "react";

import { sidebarMenuButtonVariants } from "@/components/ui/sidebar-variants";

// shadcn's sidebar, cut down to what a desktop-only app (ADR 0009) with a sidebar that never folds
// uses: no provider, no mobile sheet, no rail nor trigger. Floating: a card of its own, 256px wide.

function Sidebar({ className, ...props }: ComponentProps<"aside">) {
  return (
    <aside
      data-slot="sidebar"
      data-variant="floating"
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-card bg-sidebar text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn("flex min-h-0 flex-1 flex-col overflow-auto", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function SidebarGroup({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      { className: cn("relative flex w-full min-w-0 flex-col", className) },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group",
      sidebar: "group",
    },
  });
}

function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuButton({
  render,
  className,
  ...props
}: useRender.ComponentProps<"button"> & ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">({ className: cn(sidebarMenuButtonVariants(), className) }, props),
    render,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
    },
  });
}

// A count at the end of an entry, inside its button: in the accent, inverted on the current page.
function SidebarMenuBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "ml-auto flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-sidebar-primary px-1.75 text-xs font-bold text-sidebar-primary-foreground tabular-nums select-none group-aria-[current=page]/menu-button:bg-sidebar-primary-foreground group-aria-[current=page]/menu-button:text-sidebar-primary",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
};
