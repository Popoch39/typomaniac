import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { profileQueryOptions } from "@/api/profile";
import { ProfilePage } from "@/pages/profile-page";

// A Visitor has no profile: back to the home page.
export const Route = createFileRoute("/profile")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions);

    if (me === null) {
      throw redirect({ to: "/" });
    }

    return { me };
  },
  // A User without a Handle has no Stats to show.
  loader: ({ context }) =>
    context.me.handle === null
      ? undefined
      : context.queryClient.ensureQueryData(profileQueryOptions(context.me.handle)),
  component: ProfilePage,
});
