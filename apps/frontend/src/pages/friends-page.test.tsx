import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Presence } from "api";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

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
import { FriendsPendingPage } from "@/pages/friends-pending-page";
import { useConnectionStore } from "@/stores/connection-store";
import { useLocaleStore } from "@/stores/locale-store";
import { fakeServer } from "@/test/fake-socket";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
  place: null,
};

const alan = { id: "alan-id", handle: "alan", image: null, ornament: "gold" } as const;

const friends: Friend[] = [alan];

const requests: FriendRequests = {
  received: [{ id: "grace-id", handle: "grace", image: null, ornament: "platinum" }],
  sent: [{ id: "linus-id", handle: "linus", image: null, ornament: null }],
};

// The Tier of the Ornament worn in the row of that Handle's link, none without one.
const ornamentBy = (handle: string) =>
  screen
    .getByRole("link", { name: `@${handle}` })
    .closest("li")
    ?.querySelector("[data-ornament] use")
    ?.getAttribute("href") ?? null;

// The row of that Handle's link, to look into.
const rowOf = (handle: string) => {
  const row = screen.getByRole("link", { name: `@${handle}` }).closest("li");

  if (row === null) {
    throw new Error(`No row for @${handle}`);
  }

  return within(row);
};

const friendNamed = (handle: string): Friend => ({
  id: `${handle}-id`,
  handle,
  image: null,
  ornament: null,
});

// The server tells each Friend's Presence (the others are offline), then that nothing waits for
// Ada: she can challenge.
const tellPresences = (sockets: ReturnType<typeof fakeServer>, presences: [string, Presence][]) =>
  act(() => {
    sockets.server().receive({
      type: "friends-snapshot",
      presences: presences.map(([handle, presence]) => ({ userId: `${handle}-id`, presence })),
      requestsReceived: 1,
    });
    sockets
      .server()
      .receive({ type: "challenges-snapshot", sent: null, received: [], serverTime: 1_000 });
  });

const activities: Activity[] = [
  {
    type: "duel",
    id: "duel-1",
    at: Date.now() - 5 * 60_000,
    forfeit: true,
    friend: { ...alan, wpm: 72.4, outcome: "win", tp: null },
    opponent: {
      id: "turing-id",
      handle: "turing",
      image: null,
      ornament: null,
      wpm: 40,
      outcome: "loss",
      tp: null,
    },
  },
  {
    type: "friendship",
    id: "ada-id:alan-id",
    at: Date.now() - 2 * 86_400_000,
    friend: alan,
    other: { id: "ada-id", handle: "ada", image: null, ornament: null },
  },
];

const found: UserFound[] = [
  { id: "barbara-id", handle: "barbara", image: null, ornament: "bronze", relation: "none" },
];

// The page of `user` with their lists and a search already in the cache, on a router of its own.
const renderPage = async (
  userFriends: Friend[] = friends,
  activity: Activity[] = activities,
  user: Me = me,
) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  queryClient.setQueryData(meQueryOptions.queryKey, user);
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

// A test that opens the connection leaves none behind, even when it fails.
afterEach(() => {
  useConnectionStore.getState().close();
});

describe("FriendsPage", () => {
  test("each list is titled with its count, the Friend requests received in a badge", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 2, name: "Friend requests reçues 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Friend requests envoyées · 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Friends · 1" })).toBeInTheDocument();
  });

  test("a Friend request sent waits for its answer, and can be cancelled", async () => {
    await renderPage();

    const row = rowOf("linus");

    expect(row.getByText("en attente")).toBeInTheDocument();
    expect(
      row.getByRole("button", { name: "Annuler la Friend request à @linus" }),
    ).toBeInTheDocument();
  });

  test("each Friend shows their Presence; only one online can be challenged", async () => {
    const sockets = fakeServer();

    useConnectionStore.getState().open(sockets.open);
    await renderPage(["alan", "mary", "ken"].map(friendNamed), []);
    tellPresences(sockets, [
      ["alan", "online"],
      ["mary", "in-duel"],
    ]);

    expect(rowOf("alan").getByText("en ligne")).toBeInTheDocument();
    expect(rowOf("alan").getByRole("button", { name: "Défier @alan" })).toBeEnabled();

    expect(rowOf("mary").getByText("en Duel")).toBeInTheDocument();
    expect(rowOf("ken").getByText("hors ligne")).toBeInTheDocument();

    for (const handle of ["mary", "ken"]) {
      expect(rowOf(handle).queryByRole("button", { name: /^Défier/ })).not.toBeInTheDocument();
    }

    for (const handle of ["alan", "mary", "ken"]) {
      expect(
        rowOf(handle).getByRole("button", { name: `Retirer @${handle} de tes Friends` }),
      ).toBeInTheDocument();
    }
  });

  test("before the connection tells their Presence, a Friend has neither Presence nor Défier", async () => {
    await renderPage(friends, []);

    expect(rowOf("alan").queryByText("en ligne")).not.toBeInTheDocument();
    expect(rowOf("alan").queryByRole("button", { name: /^Défier/ })).not.toBeInTheDocument();
    expect(
      rowOf("alan").getByRole("button", { name: "Retirer @alan de tes Friends" }),
    ).toBeInTheDocument();
  });

  test("without a Handle, the User is asked to choose one before anything else", async () => {
    await renderPage(friends, activities, { ...me, handle: null });

    expect(screen.getByRole("button", { name: "Choisir mon Handle" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Chercher un User")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Activity" })).not.toBeInTheDocument();
  });

  test("while it loads, Skeletons stand in for each list and the Activity", () => {
    render(<FriendsPendingPage />);

    for (const label of [
      "Chargement des Friend requests reçues",
      "Chargement des Friend requests envoyées",
      "Chargement des Friends",
      "Chargement de l'Activity",
    ]) {
      expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
    }
  });

  test("each Handle leads to its User's Profile: Friends and Friend requests", async () => {
    await renderPage(friends, []);

    for (const handle of ["alan", "grace", "linus"]) {
      expect(screen.getByRole("link", { name: `@${handle}` })).toHaveAttribute(
        "href",
        `/u/${handle}`,
      );
    }
  });

  test("each avatar wears its User's Ornament: Friends, Friend requests, search, Activity", async () => {
    await renderPage(friends, []);

    expect(ornamentBy("alan")).toBe("#tier-ornament-gold");
    expect(ornamentBy("grace")).toBe("#tier-ornament-platinum");
    expect(ornamentBy("linus")).toBeNull();

    await userEvent.type(screen.getByLabelText("Chercher un User"), "bar");
    await screen.findByRole("link", { name: "@barbara" });

    expect(ornamentBy("barbara")).toBe("#tier-ornament-bronze");
  });

  test("an Activity's avatar wears its Friend's Ornament", async () => {
    await renderPage();

    const column = within(screen.getByRole("region", { name: "Activity" }));

    expect(
      column
        .getAllByRole("listitem")
        .map((item) => item.querySelector("[data-ornament] use")?.getAttribute("href")),
    ).toEqual(["#tier-ornament-gold", "#tier-ornament-gold"]);
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

  test("the search shows it is looking while the Handle is typed", async () => {
    await renderPage();

    await userEvent.type(screen.getByLabelText("Chercher un User"), "bar");

    expect(screen.getByRole("status", { name: "Recherche des Users" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "@barbara" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Recherche des Users" })).not.toBeInTheDocument();
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
        other: { id: "grace-id", handle: "grace", image: null, ornament: null },
      },
    });

    const column = within(screen.getByRole("region", { name: "Activity" }));

    await column.findByText("@grace");
    expect(column.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A@alan et @grace sont maintenant Friendsà l'instant",
      "A@alan a battu @turing par abandon72 wpm · 40 wpmil y a 5 minutes",
      "A@alan et @ada sont maintenant Friendsavant-hier",
    ]);
  });

  test("a Friend's arrival online comes first, and is gone once the tab starts again", async () => {
    const sockets = fakeServer();

    useConnectionStore.getState().open(sockets.open);
    await renderPage(friends, []);

    sockets.server().receive({
      type: "friend-arrived",
      arrival: { id: "arrival-1", at: Date.now(), friend: alan },
    });

    const column = within(screen.getByRole("region", { name: "Activity" }));

    await column.findByText("est en ligne", { exact: false });
    expect(column.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A@alan est en ligneà l'instant",
    ]);

    // A reload: a new store, the Activity read again without it.
    useConnectionStore.getState().close();
    cleanup();
    await renderPage();

    expect(
      within(screen.getByRole("region", { name: "Activity" })).queryByText("est en ligne", {
        exact: false,
      }),
    ).toBeNull();
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("the page, each list titled with its count", async () => {
      await renderPage();

      expect(
        screen.getByText(
          "Find a User by their Handle, answer their Friend requests, challenge your Friends who are online.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Received Friend requests 1" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Sent Friend requests · 1" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Friends · 1" })).toBeInTheDocument();
    });

    test("the Friend requests: answer those received, cancel those sent", async () => {
      await renderPage();

      expect(
        rowOf("grace").getByRole("button", { name: "Accept @grace's Friend request" }),
      ).toHaveTextContent("Accept");
      expect(
        rowOf("grace").getByRole("button", { name: "Decline @grace's Friend request" }),
      ).toHaveTextContent("Decline");
      expect(rowOf("linus").getByText("pending")).toBeInTheDocument();
      expect(
        rowOf("linus").getByRole("button", { name: "Cancel your Friend request to @linus" }),
      ).toHaveTextContent("Cancel");
    });

    test("each Friend's Presence, a Challenge for one online, and Remove", async () => {
      const sockets = fakeServer();

      useConnectionStore.getState().open(sockets.open);
      await renderPage(["alan", "mary"].map(friendNamed), []);
      tellPresences(sockets, [["alan", "online"]]);

      expect(rowOf("alan").getByText("online")).toBeInTheDocument();
      expect(rowOf("alan").getByRole("button", { name: "Challenge @alan" })).toHaveTextContent(
        "Challenge",
      );
      expect(rowOf("mary").getByText("offline")).toBeInTheDocument();
      expect(
        rowOf("mary").getByRole("button", { name: "Remove @mary from your Friends" }),
      ).toHaveTextContent("Remove");
    });

    test("without a Handle, the User is asked to choose one", async () => {
      await renderPage(friends, activities, { ...me, handle: null });

      expect(
        screen.getByText("Friends find each other by Handle. Choose yours to look for others."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Choose my Handle" })).toBeInTheDocument();
    });

    test("while it loads, each Skeleton says what it loads", () => {
      render(<FriendsPendingPage />);

      for (const label of [
        "Loading received Friend requests",
        "Loading sent Friend requests",
        "Loading Friends",
        "Loading Activity",
      ]) {
        expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
      }
    });

    test("the search: its field, what to type, the wait and a User found", async () => {
      await renderPage();

      const field = screen.getByLabelText("Find a User");

      expect(field).toHaveAttribute("placeholder", "@handle");

      await userEvent.type(field, "b");

      expect(screen.getByText("Type at least 2 characters of the Handle.")).toBeInTheDocument();

      await userEvent.type(field, "ar");

      expect(screen.getByRole("status", { name: "Looking for Users" })).toBeInTheDocument();
      expect(
        await screen.findByRole("button", { name: "Send @barbara a Friend request" }),
      ).toHaveTextContent("Add");
    });

    test("without a Friend, the empty list says how to find one", async () => {
      await renderPage([]);

      expect(screen.getByText("No Friends yet")).toBeInTheDocument();
      expect(
        screen.getByText("Look up a User by their Handle and send them a Friend request."),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Find a User" }));

      expect(screen.getByLabelText("Find a User")).toHaveFocus();
    });

    test("the Activity: the Friends' Duels and friendships, how long ago", async () => {
      await renderPage();

      const column = within(screen.getByRole("region", { name: "Activity" }));

      expect(column.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "A@alan beat @turing by Forfeit72 wpm · 40 wpm5 minutes ago",
        "A@alan and @ada are now Friends2 days ago",
      ]);
    });

    test("a Duel lost or drawn, without a Forfeit, and against a deleted User", async () => {
      const [duel] = activities;

      if (duel?.type !== "duel") {
        throw new Error("The first Activity is a Duel");
      }

      await renderPage(friends, [
        { ...duel, id: "duel-2", forfeit: false, friend: { ...duel.friend, outcome: "loss" } },
        {
          ...duel,
          id: "duel-3",
          forfeit: false,
          friend: { ...duel.friend, wpm: 1284, outcome: "draw" },
          opponent: null,
        },
      ]);

      const column = within(screen.getByRole("region", { name: "Activity" }));

      expect(column.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "A@alan lost to @turing72 wpm · 40 wpm5 minutes ago",
        "A@alan drew with Deleted User1,284 wpm5 minutes ago",
      ]);
    });

    test("an arrival online just now", async () => {
      const sockets = fakeServer();

      useConnectionStore.getState().open(sockets.open);
      await renderPage(friends, []);

      sockets.server().receive({
        type: "friend-arrived",
        arrival: { id: "arrival-1", at: Date.now(), friend: alan },
      });

      const column = within(screen.getByRole("region", { name: "Activity" }));

      await column.findByText("is online", { exact: false });
      expect(column.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
        "A@alan is onlinejust now",
      ]);
    });

    test("without Activity, the column says what will show up", async () => {
      await renderPage(friends, []);

      const column = within(screen.getByRole("region", { name: "Activity" }));

      expect(column.getByText("No Activity yet")).toBeInTheDocument();
      expect(
        column.getByText("Your Friends' Duels and new friendships will show up here."),
      ).toBeInTheDocument();
      expect(column.getByRole("button", { name: "Find a Friend" })).toBeInTheDocument();
    });
  });
});
