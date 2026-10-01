import { Tabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

// The tabs of the Friends page.
export type FriendsTabValue = "friends" | "requests" | "sent";

type FriendsTabProps = {
  value: FriendsTabValue;
  label: string;
  // After the label: how many, plain or in a badge.
  count: ReactNode;
};

// One pill of the Friends page's tabs: the chosen one filled with the text's colour.
export const FriendsTab = ({ value, label, count }: FriendsTabProps) => (
  <Tabs.Tab
    value={value}
    className="flex h-10 items-center gap-1 rounded-full px-4.5 text-sm font-semibold text-muted-foreground tabular-nums transition-colors outline-none not-data-active:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-active:bg-foreground data-active:font-bold data-active:text-background"
  >
    {/* The space is for the tab's name, « Friends 10 »: the flex gap draws it. */}
    {label} {count}
  </Tabs.Tab>
);
