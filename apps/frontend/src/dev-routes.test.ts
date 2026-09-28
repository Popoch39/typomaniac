import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, test } from "vitest";

import { withDevRoutes } from "@/dev-routes";
import { routeTree } from "@/routeTree.gen";

describe("withDevRoutes", () => {
  test("adds the dev pages beside the file routes, keeping them", () => {
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
    expect(found("/dev/rankup")).toBe("/dev/rankup");
    expect(found("/dev/duel-hud")).toBe("/dev/duel-hud");
    expect(found("/dev/faceoff")).toBe("/dev/faceoff");
    expect(found("/leaderboard")).toBe("/leaderboard");
  });
});
