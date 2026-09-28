import type { ReactNode } from "react";

import { AppFrameLayout } from "@/components/app-frame-layout";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import { duelOf, isChallenge, useDuelStore } from "@/stores/duel-store";

// The app's frame, drawn as the Duel's scene while this tab plays a Duel.
export const AppFrame = ({ children }: { children: ReactNode }) => {
  const inDuelScene = useInDuelScene();

  const challenge = useDuelStore((store) => {
    const duel = duelOf(store.state);

    return duel !== null && isChallenge(duel);
  });

  return (
    <AppFrameLayout duelFormat={inDuelScene ? { challenge } : null}>{children}</AppFrameLayout>
  );
};
