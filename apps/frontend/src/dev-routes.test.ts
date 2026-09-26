import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, test } from "vitest";

import { withDevRoutes } from "@/dev-routes";
import { routeTree } from "@/routeTree.gen";

describe("withDevRoutes", () => {
  test("adds the Aura gallery beside the file routes, keeping them", () => {
    const router = createRouter({
      routeTree: withDevRoutes(routeTree),
      history: createMemoryHistory(),
      context: { queryClient: new QueryClient() },
    });

    const found = (path: string) => {
      const [, , route] = router.getMatchedRoutes(path);

      return route?.fullPath;
    };

    expect(found("/dev/aura")).toBe("/dev/aura");
    expect(found("/leaderboard")).toBe("/leaderboard");
  });
});
