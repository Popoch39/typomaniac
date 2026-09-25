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
import { type Activity, activityQueryOptions } from "@/api/activity";
import { type Me, meQueryOptions } from "@/api/me";
import { type UserFound, userSearchQueryOptions } from "@/api/user-search";
import { LiveActivity } from "@/components/activity/live-activity";
import { FriendsPage } from "@/pages/friends-page";
import { useConnectionStore } from "@/stores/connection-store";
import { fakeServer } from "@/test/fake-socket";

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

const alan = { id: "alan-id", handle: "alan", image: null };

const activities: Activity[] = [
  {
    type: "duel",
    id: "duel-1",
    at: Date.now() - 5 * 60_000,
    forfeit: true,
    friend: { ...alan, wpm: 72.4, outcome: "win" },
    opponent: { id: "turing-id", handle: "turing", image: null, wpm: 40, outcome: "loss" },
  },
  {
    type: "friendship",
    id: "ada-id:alan-id",
    at: Date.now() - 2 * 86_400_000,
    friend: alan,
    other: { id: "ada-id", handle: "ada", image: null },
  },
];

const found: UserFound[] = [{ id: "barbara-id", handle: "barbara", image: null, relation: "none" }];

// The page with the User's lists and a search already in the cache, on a router of its own.
const renderPage = async (userFriends: Friend[] = friends, activity: Activity[] = activities) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(activityQueryOptions.queryKey, activity);
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
      <LiveActivity />
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { name: "Friends" });
};

describe("FriendsPage", () => {
  test("each Handle leads to its User's Profile: Friends and Friend requests", async () => {
    await renderPage(friends, []);

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

  test("the Activity column tells the Friends' Duels and friendships, newest first", async () => {
    await renderPage();

    const column = within(screen.getByRole("region", { name: "Activity" }));
    const items = column.getAllByRole("listitem");

    // Each row opens on the Friend's avatar, their initial without an image.
    expect(items.map((item) => item.textContent)).toEqual([
      "A@alan a battu @turing par abandon72 wpm · 40 wpmil y a 5 minutes",
      "A@alan et @ada sont maintenant Friendsavant-hier",
    ]);
    expect(column.getByRole("link", { name: "@turing" })).toHaveAttribute("href", "/u/turing");
  });

  test("without Activity, the column brings the User to the search", async () => {
    await renderPage(friends, []);

    const column = within(screen.getByRole("region", { name: "Activity" }));

    expect(column.getByText("Pas encore d'Activity")).toBeInTheDocument();

    await userEvent.click(column.getByRole("button", { name: "Chercher un Friend" }));

    expect(screen.getByLabelText("Chercher un User")).toHaveFocus();
  });

  test("an Activity told by the real-time connection comes first, without a reload", async () => {
    const sockets = fakeServer();

    useConnectionStore.getState().open(sockets.open);
    await renderPage();

    sockets.server().receive({
      type: "activity-added",
      activity: {
        type: "friendship",
        id: "alan-id:grace-id",
        at: Date.now(),
        friend: alan,
        other: { id: "grace-id", handle: "grace", image: null },
      },
    });

    const column = within(screen.getByRole("region", { name: "Activity" }));

    await column.findByText("@grace");
    expect(column.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A@alan et @grace sont maintenant Friendsà l'instant",
      "A@alan a battu @turing par abandon72 wpm · 40 wpmil y a 5 minutes",
      "A@alan et @ada sont maintenant Friendsavant-hier",
    ]);

    useConnectionStore.getState().close();
  });
});
