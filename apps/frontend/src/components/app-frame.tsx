import type { ReactNode } from "react";

import { AppFrameLayout } from "@/components/app-frame-layout";
import { DUEL_LANGUAGE, DUEL_SECONDS } from "@/components/duel/duel-format-line";
import { duelRoundView } from "@/components/duel-scene/duel-round-view";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import type { DuelPlay } from "@/stores/duel-store";
import { duelOf, isChallenge, useDuelStore } from "@/stores/duel-store";
import { useIntroStore } from "@/stores/intro-store";

// Nothing played yet: what the Rounds read outside of a Duel.
const NO_ROUNDS: DuelPlay["rounds"] = [];

// The app's frame, drawn as the Duel's scene while this tab plays a Duel, inert while the Intro
// plays over it. Each part of the Duel's format, and of where its Bo3 stands, is read on its own:
// a Keystroke never renders the frame again (the Rounds played change only between two Rounds).
export const AppFrame = ({ children }: { children: ReactNode }) => {
  const inDuelScene = useInDuelScene();

  const challenge = useDuelStore((store) => {
    const duel = duelOf(store.state);

    return duel !== null && isChallenge(duel);
  });

  const seconds = useDuelStore((store) => duelOf(store.state)?.config.seconds ?? DUEL_SECONDS);

  const language = useDuelStore((store) => duelOf(store.state)?.config.language ?? DUEL_LANGUAGE);

  const roundsToWin = useDuelStore((store) => duelOf(store.state)?.roundsToWin ?? 1);

  const roundIndex = useDuelStore((store) => duelOf(store.state)?.roundIndex ?? 0);

  const rounds = useDuelStore((store) => duelOf(store.state)?.rounds ?? NO_ROUNDS);

  const roundsWon = useDuelStore((store) => duelOf(store.state)?.roundsWon ?? 0);

  const opponentRoundsWon = useDuelStore((store) => duelOf(store.state)?.opponentRoundsWon ?? 0);

  const introPlaying = useIntroStore((store) => store.playing);

  return (
    <AppFrameLayout
      duelFormat={inDuelScene ? { challenge, bo3: roundsToWin > 1, seconds, language } : null}
      duelRound={
        inDuelScene
          ? duelRoundView({ roundsToWin, roundIndex, rounds, roundsWon, opponentRoundsWon })
          : null
      }
      inert={introPlaying}
    >
      {children}
    </AppFrameLayout>
  );
};
