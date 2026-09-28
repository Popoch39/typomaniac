import { duelSceneScale } from "@/components/duel-scene/duel-scene";

// Ref of the Duel's scene: writes its scale in `--duel-scale` now and at each resize of the window,
// without a render, so the typing never stops. Detached, the scene forgets it (React calls the
// cleanup then, never the ref with null).
export const fitDuelScene = (scene: HTMLElement | null) => {
  if (scene === null) {
    return;
  }

  const fit = () =>
    scene.style.setProperty(
      "--duel-scale",
      String(duelSceneScale(window.innerWidth, window.innerHeight)),
    );

  fit();
  window.addEventListener("resize", fit);

  return () => {
    window.removeEventListener("resize", fit);
    scene.style.removeProperty("--duel-scale");
  };
};
