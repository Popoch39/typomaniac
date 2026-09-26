import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createAudioEngine } from "@/audio/audio-engine";
import { openFaceOffSounds } from "@/audio/face-off-sounds";
import { previewSound, startSoundReactor } from "@/audio/sound-reactor";
import { openWebAudio } from "@/audio/web-audio-output";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { TabAttentionContext } from "@/components/tab-attention/tab-attention-context";
import { type SoundPreview, SoundPreviewContext } from "@/components/sound/sound-preview-context";
import "@/index.css";
import { browserTabAttention } from "@/lib/tab-attention";
import { queryClient } from "@/query-client";
import { router } from "@/router";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element in index.html");
}

const audioEngine = createAudioEngine(openWebAudio);

// Once per app load: the keys sound from the first one on.
startSoundReactor(audioEngine);

const preview: SoundPreview = (choice) => previewSound(audioEngine, choice);

// Once per app load too: its audio context is created at the first click that leads to a Duel.
const faceOffSounds = openFaceOffSounds();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SoundPreviewContext value={preview}>
        <FaceOffSoundsContext value={faceOffSounds}>
          <TabAttentionContext value={browserTabAttention}>
            <RouterProvider router={router} />
          </TabAttentionContext>
        </FaceOffSoundsContext>
      </SoundPreviewContext>
    </QueryClientProvider>
  </StrictMode>,
);
