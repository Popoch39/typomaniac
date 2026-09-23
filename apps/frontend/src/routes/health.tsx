import { createFileRoute } from "@tanstack/react-router";

import { healthQueryOptions } from "@/api/health";
import { HealthError, HealthPage } from "@/pages/health-page";

export const Route = createFileRoute("/health")({
  loader: ({ context }) => context.queryClient.ensureQueryData(healthQueryOptions),
  component: HealthPage,
  errorComponent: HealthError,
});
