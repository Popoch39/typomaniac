import { createFileRoute } from "@tanstack/react-router";

import { RankedPage } from "@/pages/ranked-page";

// The Ranked's Tiers and rules. Nothing to load: `/me` is read by the root route.
export const Route = createFileRoute("/ranked")({
  component: RankedPage,
});
