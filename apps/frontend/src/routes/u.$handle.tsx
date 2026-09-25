import { createFileRoute, notFound } from "@tanstack/react-router";

import { ApiError } from "@/api/client";
import { meQueryOptions } from "@/api/me";
import { profileQueryOptions } from "@/api/profile";
import { UserProfileNotFoundPage } from "@/pages/user-profile-not-found-page";
import { UserProfilePage } from "@/pages/user-profile-page";

// A User's Profile, by their Handle. A Visitor stays, invited to sign in: nothing to load for them
// (the API answers 401). An unknown Handle, or one given up, answers 404: the not-found page. Any
// other failure is the router's error page, never a false « introuvable ».
export const Route = createFileRoute("/u/$handle")({
  beforeLoad: async ({ context }) => ({
    signedIn: (await context.queryClient.ensureQueryData(meQueryOptions)) !== null,
  }),
  loader: async ({ context, params }) => {
    if (!context.signedIn) {
      return;
    }

    try {
      await context.queryClient.ensureQueryData(profileQueryOptions(params.handle));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  component: UserProfilePage,
  notFoundComponent: UserProfileNotFoundPage,
});
