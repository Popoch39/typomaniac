import { createRoute, lazyRouteComponent } from "@tanstack/react-router";

import type { routeTree } from "@/routeTree.gen";

// The routes only a dev build has, added in code beside the file routes so they never enter
// `routeTree.gen.ts` nor the production bundle: called behind `import.meta.env.DEV` only, this
// module is then dropped whole. Their pages load on demand. The tree is extended in place, as
// `addChildren` does, and returned for `createRouter`.
export const withDevRoutes = (tree: typeof routeTree) => {
  const auraGallery = createRoute({
    getParentRoute: () => tree,
    path: "/dev/aura",
    component: lazyRouteComponent(() => import("@/pages/aura-gallery-page"), "AuraGalleryPage"),
  });

  const tierUp = createRoute({
    getParentRoute: () => tree,
    path: "/dev/rankup",
    component: lazyRouteComponent(() => import("@/pages/tier-up-dev-page"), "TierUpDevPage"),
  });

  const duelHud = createRoute({
    getParentRoute: () => tree,
    path: "/dev/duel-hud",
    component: lazyRouteComponent(() => import("@/pages/duel-hud-dev-page"), "DuelHudDevPage"),
  });

  const faceOff = createRoute({
    getParentRoute: () => tree,
    path: "/dev/faceoff",
    component: lazyRouteComponent(() => import("@/pages/face-off-dev-page"), "FaceOffDevPage"),
  });

  // PROTOTYPE, throwaway: the Maniac's keystroke waves, tuned live.
  const auraManiacPrototype = createRoute({
    getParentRoute: () => tree,
    path: "/dev/aura-maniac-prototype",
    component: lazyRouteComponent(
      () => import("@/pages/aura-maniac-prototype-page"),
      "AuraManiacPrototypePage",
    ),
  });

  tree.addChildren([
    ...Object.values(tree.children ?? {}),
    auraGallery,
    tierUp,
    duelHud,
    faceOff,
    auraManiacPrototype,
  ]);

  return tree;
};
