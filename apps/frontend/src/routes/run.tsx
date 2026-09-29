import { createFileRoute } from "@tanstack/react-router";

import { RunPage } from "@/pages/run-page";

export const Route = createFileRoute("/run")({
  component: RunPage,
});
