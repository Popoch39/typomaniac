import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createAudioEngine } from "@/audio/audio-engine";
import { openFaceOffSounds } from "@/audio/face-off-sounds";
import { previewSound, startSoundReactor } from "@/audio/sound-reactor";
import { openWebAudio } from "@/audio/web-audio-output";
import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { introAtStartup } from "@/components/intro/intro-at-startup";
import { IntroGate } from "@/components/intro/intro-gate";
import { readyOnFirstRender } from "@/components/intro/ready-on-first-render";
import { TabAttentionContext } from "@/components/tab-attention/tab-attention-context";
import { type SoundPreview, SoundPreviewContext } from "@/components/sound/sound-preview-context";
import "@/index.css";
import { browserAuraRuntime } from "@/lib/aura-runtime";
import { browserTabAttention } from "@/lib/tab-attention";
import { queryClient } from "@/query-client";
import { router } from "@/router";
import { useIntroStore } from "@/stores/intro-store";

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

// Once per app load: one IntersectionObserver for every Ornament on the page.
const auraRuntime = browserAuraRuntime();

// Once per app load, before the first render: whether the Intro plays over it.
if (introAtStartup()) {
  useIntroStore.getState().play();
  readyOnFirstRender(router);
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SoundPreviewContext value={preview}>
        <FaceOffSoundsContext value={faceOffSounds}>
          <TabAttentionContext value={browserTabAttention}>
            <AuraRuntimeContext value={auraRuntime}>
              <IntroGate />
              <RouterProvider router={router} />
            </AuraRuntimeContext>
          </TabAttentionContext>
        </FaceOffSoundsContext>
      </SoundPreviewContext>
    </QueryClientProvider>
  </StrictMode>,
);
