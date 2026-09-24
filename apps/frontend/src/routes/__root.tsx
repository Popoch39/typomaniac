import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";
import { RootLayout } from "@/pages/root-layout";

type RouterContext = {
  queryClient: QueryClient;
};

const RootSearchSchema = Type.Object({
  // Set by Better Auth when an OAuth round trip fails.
  error: Type.Optional(Type.String()),
});

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: (search): typeof RootSearchSchema.static =>
    Value.Check(RootSearchSchema, search) ? { error: search.error } : {},
  // Every page knows up front whether a User is signed in: no Visitor-then-User flash. And their
  // Pace, for the solo Run.
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions);

    await context.queryClient.ensureQueryData(paceQueryOptions(me));
  },
  component: RootLayout,
});
