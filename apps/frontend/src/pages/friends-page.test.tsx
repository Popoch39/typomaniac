import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { describe, expect, test } from "vitest";

import {
  type Friend,
  type FriendRequests,
  friendRequestsQueryOptions,
  friendsQueryOptions,
} from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { type UserFound, userSearchQueryOptions } from "@/api/user-search";
import { FriendsPage } from "@/pages/friends-page";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
};

const friends: Friend[] = [{ id: "alan-id", handle: "alan", image: null }];

const requests: FriendRequests = {
  received: [{ id: "grace-id", handle: "grace", image: null }],
  sent: [{ id: "linus-id", handle: "linus", image: null }],
};

const found: UserFound[] = [{ id: "barbara-id", handle: "barbara", image: null, relation: "none" }];

// The page with the User's lists and a search already in the cache, on a router of its own.
const renderPage = async (userFriends: Friend[] = friends) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(friendsQueryOptions.queryKey, userFriends);
  queryClient.setQueryData(friendRequestsQueryOptions.queryKey, requests);
  queryClient.setQueryData(userSearchQueryOptions("bar").queryKey, found);

  const router = createRouter({
    routeTree: createRootRoute({ component: FriendsPage }),
    history: createMemoryHistory({ initialEntries: ["/friends"] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { name: "Friends" });
};

describe("FriendsPage", () => {
  test("each Handle leads to its User's Profile: Friends and Friend requests", async () => {
    await renderPage();

    for (const handle of ["alan", "grace", "linus"]) {
      expect(screen.getByRole("link", { name: `@${handle}` })).toHaveAttribute(
        "href",
        `/u/${handle}`,
      );
    }
  });

  test("a User found leads to their Profile, next to the Friend request", async () => {
    await renderPage();

    await userEvent.type(screen.getByLabelText("Chercher un User"), "bar");

    const link = await screen.findByRole("link", { name: "@barbara" });
    const row = link.closest("li");

    expect(link).toHaveAttribute("href", "/u/barbara");
    expect(row).not.toBeNull();
    expect(
      within(row ?? document.body).getByRole("button", {
        name: "Envoyer une Friend request à @barbara",
      }),
    ).toBeInTheDocument();
  });

  test("without a Friend, the empty list brings the User to the search", async () => {
    await renderPage([]);

    await userEvent.click(screen.getByRole("button", { name: "Chercher un User" }));

    expect(screen.getByLabelText("Chercher un User")).toHaveFocus();
  });
});
