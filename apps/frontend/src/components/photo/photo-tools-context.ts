import { createContext, use } from "react";

import { browserPhotoTools, type PhotoTools } from "@/components/photo/photo-tools";

// Split out of the components so their files only export components (react/only-export-components).
// Injected so tests choose a photo without a browser's decoder nor canvas.
export const PhotoToolsContext = createContext<PhotoTools>(browserPhotoTools);

export const usePhotoTools = () => use(PhotoToolsContext);
