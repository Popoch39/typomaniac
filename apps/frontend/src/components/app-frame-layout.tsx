import { cn } from "cn";
import type { ReactNode } from "react";

import type { DuelFormat } from "@/components/duel/duel-format-line";
import { DUEL_SCENE } from "@/components/duel-scene/duel-scene";
import { DuelSceneHeader } from "@/components/duel-scene/duel-scene-header";
import { fitDuelScene } from "@/components/duel-scene/fit-duel-scene";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

type AppFrameLayoutProps = {
  // The Duel whose scene the frame is; null for the app's own layout.
  duelFormat: DuelFormat | null;
  // A Solo Run is being typed: the sidebar leaves the window.
  soloTyping: boolean;
  // While the Intro plays over it: out of reach, nothing takes the focus.
  inert: boolean;
  children: ReactNode;
};

// The sidebar and the page right of it. During a Duel, the Duel's scene: the sidebar hidden, the
// page fixed at the size of its board under the scene's own header, centred and scaled to the
// window. The same elements either way, so the page is never mounted again as the Duel starts or
// ends.
export const AppFrameLayout = ({
  duelFormat,
  soloTyping,
  inert,
  children,
}: AppFrameLayoutProps) => {
  const inDuelScene = duelFormat !== null;

  return (
    <div
      inert={inert}
      data-duel-scene={inDuelScene ? "" : undefined}
      className="flex min-h-svh w-full items-start gap-3 p-3"
    >
      <AppSidebar hidden={inDuelScene} retreated={soloTyping} />
      <div
        ref={inDuelScene ? fitDuelScene : null}
        style={inDuelScene ? DUEL_SCENE : undefined}
        className={cn(
          "flex min-w-0 flex-col",
          inDuelScene
            ? "fixed top-1/2 left-1/2 -translate-1/2 scale-(--duel-scale) px-8 pt-6 pb-5"
            : "min-h-[calc(100svh-1.5rem)] flex-1 pt-9 pr-11 pb-7 pl-12",
        )}
      >
        {duelFormat === null ? null : <DuelSceneHeader format={duelFormat} />}
        <main data-intro="page" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
