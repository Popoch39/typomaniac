import { createContext, use } from "react";

import { type AuraRuntime, steadyAuraRuntime } from "@/lib/aura-runtime";

// Split out of the components so their files only export components (react/only-export-components).

// What the Aura reads from the browser. Injected: the app hands the browser's, tests a fake.
// Steady by default: always on screen, the tab always shown.
export const AuraRuntimeContext = createContext<AuraRuntime>(steadyAuraRuntime);

export const useAuraRuntime = () => use(AuraRuntimeContext);
