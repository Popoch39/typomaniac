import { createContext, use } from "react";

import type { SoundChoice } from "@/stores/sound-store";

// Split out of the components so their files only export components (react/only-export-components).

// Plays a key of the pack from the picker. Injected: the app hands the one of its audio engine,
// tests a fake. Silent by default.
export type SoundPreview = (choice: SoundChoice) => void;

export const SoundPreviewContext = createContext<SoundPreview>(() => {});

export const useSoundPreview = () => use(SoundPreviewContext);
