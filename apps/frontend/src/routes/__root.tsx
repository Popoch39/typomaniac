import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
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
  // Every page knows up front whether a User is signed in: no Visitor-then-User flash.
  beforeLoad: ({ context }) => context.queryClient.ensureQueryData(meQueryOptions),
  component: RootLayout,
});
