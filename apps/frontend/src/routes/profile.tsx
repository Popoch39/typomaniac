import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { ProfilePage } from "@/pages/profile-page";

// A Visitor has no profile: back to the home page.
export const Route = createFileRoute("/profile")({
  beforeLoad: async ({ context }) => {
    if ((await context.queryClient.ensureQueryData(meQueryOptions)) === null) {
      throw redirect({ to: "/" });
    }
  },
  component: ProfilePage,
});
