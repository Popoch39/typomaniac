import { cn } from "cn";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DUEL_SCENE } from "@/components/duel-scene/duel-scene";
import { fitDuelScene } from "@/components/duel-scene/fit-duel-scene";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";

// The header and the page. During a Duel, the Duel's scene: fixed at the size of its board,
// centred and scaled to the window, header included. The same elements either way, so the page
// is never mounted again as the Duel starts or ends.
export const AppFrame = ({ children }: { children: ReactNode }) => {
  const inDuelScene = useInDuelScene();

  return (
    <div
      ref={inDuelScene ? fitDuelScene : null}
      data-duel-scene={inDuelScene ? "" : undefined}
      style={inDuelScene ? DUEL_SCENE : undefined}
      className={cn(
        "flex flex-col px-8",
        inDuelScene
          ? "fixed top-1/2 left-1/2 -translate-1/2 scale-(--duel-scale) pt-6 pb-5"
          : "mx-auto min-h-svh w-full max-w-7xl gap-5 py-6",
      )}
    >
      <AppHeader inDuelScene={inDuelScene} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
};
