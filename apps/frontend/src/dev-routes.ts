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

  tree.addChildren([...Object.values(tree.children ?? {}), auraGallery]);

  return tree;
};
