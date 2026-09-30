import type { ReactNode } from "react";

import { AppFrameLayout } from "@/components/app-frame-layout";
import { DUEL_LANGUAGE, DUEL_SECONDS } from "@/components/duel/duel-format-line";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import { useSoloRunTyping } from "@/components/run/use-solo-run-typing";
import { duelOf, isChallenge, useDuelStore } from "@/stores/duel-store";
import { useIntroStore } from "@/stores/intro-store";

// The app's frame, drawn as the Duel's scene while this tab plays a Duel, its sidebar gone while
// a Solo Run is typed, inert while the Intro plays over it. Each part of the Duel's format is read
// on its own: a Keystroke never renders the frame again.
export const AppFrame = ({ children }: { children: ReactNode }) => {
  const inDuelScene = useInDuelScene();
  const soloTyping = useSoloRunTyping();

  const challenge = useDuelStore((store) => {
    const duel = duelOf(store.state);

    return duel !== null && isChallenge(duel);
  });

  const seconds = useDuelStore((store) => duelOf(store.state)?.config.seconds ?? DUEL_SECONDS);

  const language = useDuelStore((store) => duelOf(store.state)?.config.language ?? DUEL_LANGUAGE);

  const introPlaying = useIntroStore((store) => store.playing);

  return (
    <AppFrameLayout
      duelFormat={inDuelScene ? { challenge, seconds, language } : null}
      soloTyping={soloTyping}
      inert={introPlaying}
    >
      {children}
    </AppFrameLayout>
  );
};
