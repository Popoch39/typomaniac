import type { ReactNode } from "react";

import { AppFrameLayout } from "@/components/app-frame-layout";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import { useSoloRunTyping } from "@/components/run/use-solo-run-typing";
import { duelOf, isChallenge, useDuelStore } from "@/stores/duel-store";

// The app's frame, drawn as the Duel's scene while this tab plays a Duel, its sidebar faded while
// a Solo Run is typed.
export const AppFrame = ({ children }: { children: ReactNode }) => {
  const inDuelScene = useInDuelScene();
  const soloTyping = useSoloRunTyping();

  const challenge = useDuelStore((store) => {
    const duel = duelOf(store.state);

    return duel !== null && isChallenge(duel);
  });

  return (
    <AppFrameLayout duelFormat={inDuelScene ? { challenge } : null} soloTyping={soloTyping}>
      {children}
    </AppFrameLayout>
  );
};
