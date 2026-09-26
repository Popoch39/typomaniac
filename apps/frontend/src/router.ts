import { createRouter } from "@tanstack/react-router";

import { withDevRoutes } from "@/dev-routes";
import { queryClient } from "@/query-client";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
  routeTree: import.meta.env.DEV ? withDevRoutes(routeTree) : routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  // React Query owns caching: always let loaders call ensureQueryData on preload.
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
