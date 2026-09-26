import { createContext, use } from "react";

import { quietTabAttention, type TabAttention } from "@/lib/tab-attention";

// Split out of the components so their files only export components (react/only-export-components).

// The tab's title and notifications. Injected: the app hands the browser's, tests a fake. Quiet by
// default.
export const TabAttentionContext = createContext<TabAttention>(quietTabAttention);

export const useTabAttention = () => use(TabAttentionContext);
