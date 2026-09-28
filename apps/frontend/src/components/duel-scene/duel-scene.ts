// The Duel is drawn on a scene of this size, header included, as in its board (B2 · Affiche),
// then scaled to the window.
export const DUEL_SCENE = { width: 1280, height: 820 } as const;

// How much the scene is scaled so that it fits whole in a window of `width` × `height`: down in a
// smaller window, up in a larger one, never scrolled.
export const duelSceneScale = (width: number, height: number) =>
  Math.min(width / DUEL_SCENE.width, height / DUEL_SCENE.height);
