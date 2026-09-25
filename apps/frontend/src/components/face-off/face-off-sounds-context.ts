import { createContext, use } from "react";

import { type FaceOffSounds, silentFaceOffSounds } from "@/audio/face-off-sounds";

// Split out of the components so their files only export components (react/only-export-components).

// The Face-off's sounds. Injected: the app hands its Web Audio ones, tests a fake. Silent by
// default.
export const FaceOffSoundsContext = createContext<FaceOffSounds>(silentFaceOffSounds);

export const useFaceOffSounds = () => use(FaceOffSoundsContext);
