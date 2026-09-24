import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createAudioEngine } from "@/audio/audio-engine";
import { startSoundReactor } from "@/audio/sound-reactor";
import { openWebAudio } from "@/audio/web-audio-output";
import { ThemeProvider } from "@/components/theme-provider";
import "@/index.css";
import { queryClient } from "@/query-client";
import { router } from "@/router";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element in index.html");
}

// Once per app load: the keys sound from the first one on.
startSoundReactor(createAudioEngine(openWebAudio));

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
