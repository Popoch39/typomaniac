import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { Presence, ServerMessage } from "api";
import type { Rank } from "ranked";
import { defaultPace, type RunConfig } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Friend, friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";
import { AppFrame } from "@/components/app-frame";
import { ClockContext } from "@/components/run/clock-context";
import { FOLD_SECONDS } from "@/components/sidebar/use-sidebar-fold";
import { Toaster } from "@/components/ui/sonner";
import { HomePage } from "@/pages/home-page";
import { RunPage } from "@/pages/run-page";
import { useAuthStore } from "@/stores/auth-store";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlayStore } from "@/stores/play-store";
import { useRunStore } from "@/stores/run-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useThemeStore } from "@/stores/theme-store";
import { fakeServer, idle } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { setViewportWidth } from "@/test/viewport";

const ada: Me = {
  id: "ada-id",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
  place: null,
};

// Seed 42 in English, version 1, gives this Text (pinned in the typing-engine tests).
const text = "small help while late letter sell driver quiet never learn";

const words10: RunConfig = {
  mode: "words",
  words: 10,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

let sockets = fakeServer();

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(useSettingsStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
  useThemeStore.setState(useThemeStore.getInitialState());
  sockets = fakeServer();
  useConnectionStore.getState().open(sockets.open);
  sockets.server().receive(idle());
});

afterEach(() => {
  useConnectionStore.getState().close();
  useAuthStore.setState(useAuthStore.getInitialState());
  vi.unstubAllGlobals();
});

// The app's pages but the play page: only their heading, the sidebar is what is looked at.
const PAGES = [
  ["/ranked", "Ranked"],
  ["/leaderboard", "Classement"],
  ["/history", "Historique"],
  ["/friends", "Friends"],
  ["/profile", "Profil"],
  ["/themes", "Thèmes"],
  ["/u/$handle", "Profile"],
] as const;

// The app's frame around its pages, at `path`, for `me` (a Visitor when null), the cache seeded the
// way the root route's beforeLoad leaves it, with `friends` as the User's Friends.
const renderApp = async (me: Me | null, path = "/leaderboard", friends: Friend[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(paceQueryOptions(me).queryKey, defaultPace);
  queryClient.setQueryData(friendsQueryOptions.queryKey, friends);

  const rootRoute = createRootRoute({
    component: () => (
      <AppFrame>
        <Outlet />
      </AppFrame>
    ),
  });

  const playRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomePage,
  });

  const runRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/run",
    component: RunPage,
  });

  const pageRoutes = PAGES.map(([pagePath, title]) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: pagePath,
      component: () => <h1>{title}</h1>,
    }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren([playRoute, runRoute, ...pageRoutes]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();
  render(
    <QueryClientProvider client={queryClient}>
      <ClockContext value={() => 1_000}>
        <RouterProvider router={router} />
        <Toaster />
      </ClockContext>
    </QueryClientProvider>,
  );
  // Unnamed: the sidebar is named in the Locale of the test.
  await screen.findByRole("complementary");

  return { queryClient, user: userEvent.setup() };
};

const sidebar = () => screen.getByRole("complementary", { name: "Barre latérale" });

const nav = () => within(sidebar()).getByRole("navigation", { name: "Navigation principale" });

const navLinks = () =>
  within(nav())
    .getAllByRole("link")
    .map((link) => link.textContent);

const withRank = (rank: Rank | null): Me => ({ ...ada, rank });

// The User's whole card: the button that opens their menu.
const card = (name = "ada") => within(sidebar()).getByRole("button", { name: `Menu de ${name}` });

describe("the sidebar's nav", () => {
  test("a Visitor has Jouer, Ranked and Classement only", async () => {
    await renderApp(null);

    expect(navLinks()).toEqual(["Jouer", "Ranked", "Classement"]);
  });

  test("a User also has Historique, Friends and Profil, and Thèmes is no longer in it", async () => {
    await renderApp(ada);

    expect(navLinks()).toEqual([
      "Jouer",
      "Ranked",
      "Classement",
      "Historique",
      "Friends",
      "Profil",
    ]);
    expect(within(nav()).queryByRole("link", { name: /Thème/ })).not.toBeInTheDocument();
  });

  test("the brand leads to Jouer", async () => {
    await renderApp(ada);

    expect(within(sidebar()).getByRole("link", { name: "typomaniac" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("the current page's entry is marked, and only it", async () => {
    await renderApp(ada, "/history");

    expect(within(nav()).getByRole("link", { name: "Historique" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav()).getByRole("link", { name: "Jouer" })).not.toHaveAttribute("aria-current");
  });

  test("the Friend requests received are counted on Friends", async () => {
    await renderApp(ada);
    act(() =>
      sockets.server().receive({ type: "friends-snapshot", presences: [], requestsReceived: 2 }),
    );

    const friends = within(nav()).getByRole("link", { name: /^Friends/ });

    expect(within(friends).getByLabelText("2 Friend requests")).toHaveTextContent("2");
  });

  test("a User without a Handle gets no count", async () => {
    await renderApp({ ...ada, handle: null });
    act(() =>
      sockets.server().receive({ type: "friends-snapshot", presences: [], requestsReceived: 2 }),
    );

    expect(within(nav()).getByRole("link", { name: "Friends" })).toBeInTheDocument();
    expect(screen.queryByLabelText("2 Friend requests")).not.toBeInTheDocument();
  });
});

const friend = (handle: string): Friend => ({
  id: `${handle}-id`,
  handle,
  image: null,
  ornament: null,
});

// The server tells each Friend's Presence, then that nothing waits for Ada: she can challenge.
const tellPresences = (presences: [string, Presence][]) =>
  act(() => {
    sockets.server().receive({
      type: "friends-snapshot",
      presences: presences.map(([handle, presence]) => ({ userId: `${handle}-id`, presence })),
      requestsReceived: 0,
    });
    sockets
      .server()
      .receive({ type: "challenges-snapshot", sent: null, received: [], serverTime: 1_000 });
  });

const onlineSection = () => within(sidebar()).getByRole("region", { name: /^En ligne/ });

// Each row as its Handle and its Presence in words.
const onlineRows = () =>
  within(onlineSection())
    .getAllByRole("listitem")
    .map(
      (row) =>
        `${within(row).getByRole("link").textContent} ${within(row).getByText(/^en /).textContent}`,
    );

describe("the sidebar's Friends online", () => {
  test("those online first, each to challenge, then those in a Duel, without Défier", async () => {
    await renderApp(ada, "/leaderboard", ["alan", "grace", "linus", "mary"].map(friend));
    tellPresences([
      ["alan", "in-duel"],
      ["grace", "online"],
      ["linus", "offline"],
      ["mary", "online"],
    ]);

    expect(onlineSection()).toHaveAccessibleName("En ligne · 3");
    expect(onlineRows()).toEqual(["@grace en ligne", "@mary en ligne", "@alan en Duel"]);
    expect(within(onlineSection()).getByRole("button", { name: "Défier @grace" })).toBeEnabled();
    expect(
      within(onlineSection()).queryByRole("button", { name: /Défier @alan/ }),
    ).not.toBeInTheDocument();
  });

  test("a Friend's Handle leads to their Profile", async () => {
    await renderApp(ada, "/leaderboard", [friend("grace")]);
    tellPresences([["grace", "online"]]);

    expect(within(onlineSection()).getByRole("link", { name: "@grace" })).toHaveAttribute(
      "href",
      "/u/grace",
    );
  });

  test("Défier sends the Challenge", async () => {
    const { user } = await renderApp(ada, "/leaderboard", [friend("grace")]);

    tellPresences([["grace", "online"]]);
    await user.click(within(onlineSection()).getByRole("button", { name: "Défier @grace" }));

    expect(sockets.server().sent).toContainEqual({ type: "send-challenge", userId: "grace-id" });
  });

  test("Défier is disabled, with its reason, while a Challenge waits", async () => {
    await renderApp(ada, "/leaderboard", [friend("grace"), friend("mary")]);
    tellPresences([
      ["grace", "online"],
      ["mary", "online"],
    ]);
    act(() =>
      sockets.server().receive({
        type: "challenge-sent",
        challenge: { id: "c1", to: { id: "mary-id", handle: "mary", image: null }, expiresAt: 0 },
        serverTime: 1_000,
      }),
    );

    expect(
      within(onlineSection()).getByRole("button", {
        name: "Défier @grace : Un Challenge attend déjà sa réponse",
      }),
    ).toBeDisabled();
  });

  test("5 rows at most, then the way to all the Friends", async () => {
    const handles = ["a1", "a2", "a3", "a4", "a5", "a6", "a7"];

    await renderApp(ada, "/leaderboard", [...handles, "off"].map(friend));
    tellPresences(handles.map((handle) => [handle, "online"]));

    expect(onlineSection()).toHaveAccessibleName("En ligne · 7");
    expect(onlineRows()).toHaveLength(5);
    expect(
      within(onlineSection()).getByRole("link", { name: "Tous tes Friends · 8" }),
    ).toHaveAttribute("href", "/friends");
  });

  test("follows the Presences as they change", async () => {
    await renderApp(ada, "/leaderboard", [friend("grace"), friend("mary")]);
    tellPresences([["grace", "online"]]);

    act(() =>
      sockets.server().receive({ type: "presence", userId: "mary-id", presence: "online" }),
    );
    act(() =>
      sockets.server().receive({ type: "presence", userId: "grace-id", presence: "in-duel" }),
    );

    expect(onlineRows()).toEqual(["@mary en ligne", "@grace en Duel"]);
  });

  test("says so when no Friend is there, with the way to them", async () => {
    await renderApp(ada, "/leaderboard", [friend("grace")]);
    tellPresences([["grace", "offline"]]);

    expect(onlineSection()).toHaveAccessibleName("En ligne · 0");
    expect(within(onlineSection()).getByText("Aucun Friend en ligne")).toBeInTheDocument();
    expect(
      within(onlineSection()).getByRole("link", { name: "Tous tes Friends · 1" }),
    ).toHaveAttribute("href", "/friends");
  });

  test("shows rows in their place, and no text, until the Presences are told", async () => {
    await renderApp(ada, "/leaderboard", [friend("grace")]);

    expect(
      within(sidebar()).getByRole("status", { name: "Chargement des Friends en ligne" }),
    ).toBeInTheDocument();
    expect(within(sidebar()).queryByRole("region", { name: /^En ligne/ })).not.toBeInTheDocument();
    expect(within(sidebar()).queryByText("Aucun Friend en ligne")).not.toBeInTheDocument();
  });

  test("in the Queue, says the Friends can be challenged without leaving it", async () => {
    usePlayStore.setState({ play: "duel" });
    await renderApp(ada, "/", [friend("grace")]);
    tellPresences([["grace", "online"]]);

    expect(
      within(onlineSection()).queryByText("Défie-les sans quitter la Queue."),
    ).not.toBeInTheDocument();

    act(() => sockets.server().receive({ type: "queued" }));

    expect(
      within(onlineSection()).getByText("Défie-les sans quitter la Queue."),
    ).toBeInTheDocument();
  });

  test("a Visitor has none", async () => {
    await renderApp(null);
    tellPresences([]);

    expect(within(sidebar()).queryByRole("region", { name: /^En ligne/ })).not.toBeInTheDocument();
  });

  test("a User without a Handle has none", async () => {
    await renderApp({ ...ada, handle: null }, "/leaderboard", [friend("grace")]);
    tellPresences([["grace", "online"]]);

    expect(within(sidebar()).queryByRole("region", { name: /^En ligne/ })).not.toBeInTheDocument();
  });
});

describe("the Theme button", () => {
  test("leads to the Themes with the Theme's name, marked on their page", async () => {
    await renderApp(ada, "/themes");

    expect(within(sidebar()).getByRole("link", { name: "Thème Corail" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("names the Theme chosen", async () => {
    useThemeStore.getState().setTheme("lagoon");
    await renderApp(null);

    expect(within(sidebar()).getByRole("link", { name: "Thème Lagon" })).toBeInTheDocument();
  });

  test("is not marked elsewhere", async () => {
    await renderApp(null);

    expect(within(sidebar()).getByRole("link", { name: "Thème Corail" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("the User's card", () => {
  test("shows their Handle and, in a Division, its rank and TP out of 100", async () => {
    await renderApp(withRank({ tier: "gold", division: 2, tp: 42, shielded: false }));

    expect(within(card()).getByText("ada")).toBeInTheDocument();
    expect(within(card()).getByText("Gold II")).toBeInTheDocument();
    expect(within(card()).getByText("42 TP")).toBeInTheDocument();

    const meter = within(card()).getByRole("meter", { name: "TP de la Division" });

    expect(meter).toHaveAttribute("value", "42");
    expect(meter).toHaveAttribute("max", "100");
    expect(meter).toHaveAttribute("aria-valuetext", "42 TP sur 100 · 58 TP avant Gold I");
  });

  test("describes the button by the rank", async () => {
    await renderApp({
      ...withRank({ tier: "gold", division: 2, tp: 42, shielded: false }),
      place: 51,
    });

    expect(card()).toHaveAccessibleDescription("Gold II 51e mondial 42 TP");
  });

  test("in Placement, the Duels played out of 5", async () => {
    await renderApp(withRank({ placementsLeft: 2 }));

    expect(within(card()).getByText("Placement")).toBeInTheDocument();
    expect(within(card()).getByText("3 / 5")).toBeInTheDocument();

    const meter = within(card()).getByRole("meter", { name: "Placement" });

    expect(meter).toHaveAttribute("value", "3");
    expect(meter).toHaveAttribute("max", "5");
  });

  test("a Maniac's TP, without a bar", async () => {
    await renderApp(withRank({ tier: "maniac", tp: 1250, shielded: false }));

    expect(within(card()).getByText("Maniac")).toBeInTheDocument();
    expect(within(card()).getByText("1 250 TP")).toBeInTheDocument();
    expect(within(card()).queryByRole("meter")).not.toBeInTheDocument();
  });

  test("without a Rating, neither rank nor bar", async () => {
    await renderApp(ada);

    expect(within(card()).queryByText(/TP/)).not.toBeInTheDocument();
    expect(within(card()).queryByRole("meter")).not.toBeInTheDocument();
  });

  test("shows the User's Place in the Leaderboard, next to the rank", async () => {
    await renderApp({
      ...withRank({ tier: "diamond", division: 2, tp: 83, shielded: false }),
      place: 51,
    });

    expect(within(card()).getByText("51e mondial")).toBeInTheDocument();
  });

  test("no Place out of the Leaderboard", async () => {
    await renderApp(withRank({ placementsLeft: 2 }));

    expect(within(card()).queryByText(/mondial/)).not.toBeInTheDocument();
  });

  test("the whole card opens the User's menu", async () => {
    const { user } = await renderApp(
      withRank({ tier: "gold", division: 2, tp: 42, shielded: false }),
    );

    await user.click(within(card()).getByText("Gold II"));

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(card()).toHaveAttribute("aria-expanded", "true");
  });

  test("follows the rank when the User is read again after a Duel", async () => {
    const { queryClient } = await renderApp(
      withRank({ tier: "gold", division: 2, tp: 90, shielded: false }),
    );

    act(() =>
      queryClient.setQueryData(
        meQueryOptions.queryKey,
        withRank({ tier: "gold", division: 1, tp: 5, shielded: true }),
      ),
    );

    expect(await within(card()).findByText("Gold I")).toBeInTheDocument();
    expect(within(card()).getByText("5 TP")).toBeInTheDocument();
  });

  test("the avatar wears the User's Ornament", async () => {
    await renderApp({
      ...withRank({ tier: "platinum", division: 3, tp: 10, shielded: false }),
      ornament: "platinum",
      ornamentChoice: "follow",
    });

    expect(sidebar().querySelector("[data-ornament] use")?.getAttribute("href")).toBe(
      "#tier-ornament-platinum",
    );
  });

  test("the avatar falls back on the initials of the Handle, then of the name without one", async () => {
    await renderApp({ ...ada, handle: "alan turing" });

    expect(within(sidebar()).getByText("AT")).toBeInTheDocument();
  });

  test("without a Handle, the name stands for it", async () => {
    await renderApp({ ...ada, handle: null });

    expect(within(sidebar()).getByText("AL")).toBeInTheDocument();
    expect(within(sidebar()).getByText("Ada Lovelace")).toBeInTheDocument();
  });
});

describe("the User's menu", () => {
  test("leads to their public Profile and to the Handle's settings", async () => {
    const { user } = await renderApp(ada);

    await user.click(screen.getByRole("button", { name: "Menu de ada" }));

    expect(await screen.findByRole("menuitem", { name: "Mon Profile" })).toHaveAttribute(
      "href",
      "/u/ada",
    );
    expect(screen.getByRole("menuitem", { name: "Réglages du Handle" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  test("has no public Profile to lead to without a Handle", async () => {
    const { user } = await renderApp({ ...ada, handle: null });

    await user.click(screen.getByRole("button", { name: "Menu de Ada Lovelace" }));

    await screen.findByRole("menuitem", { name: "Réglages du Handle" });
    expect(screen.queryByRole("menuitem", { name: "Mon Profile" })).not.toBeInTheDocument();
  });

  test("leads to the User's own page of the Leaderboard, their Place with it", async () => {
    const { user } = await renderApp({
      ...withRank({ tier: "diamond", division: 2, tp: 83, shielded: false }),
      place: 51,
    });

    await user.click(card());

    const place = await screen.findByRole("menuitem", { name: /^Ma place au Classement/ });

    expect(place).toHaveAttribute("href", "/leaderboard?at=me");
    expect(within(place).getByText("51e")).toBeInTheDocument();
  });

  test("has no Place to lead to out of the Leaderboard", async () => {
    const { user } = await renderApp(withRank({ placementsLeft: 2 }));

    await user.click(card());

    await screen.findByRole("menuitem", { name: "Réglages du Handle" });
    expect(
      screen.queryByRole("menuitem", { name: /^Ma place au Classement/ }),
    ).not.toBeInTheDocument();
  });

  test("signing out closes the Session and forgets the User", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ success: true }),
    );

    vi.stubGlobal("fetch", fetch);

    const { user } = await renderApp(ada);

    await user.click(screen.getByRole("button", { name: "Menu de ada" }));
    await user.click(await screen.findByRole("menuitem", { name: "Se déconnecter" }));

    expect(await within(sidebar()).findByRole("button", { name: "Se connecter" })).toBeVisible();
    expect(String(fetch.mock.calls[0]?.at(0))).toMatch(/\/api\/auth\/sign-out$/);
    expect(navLinks()).toEqual(["Jouer", "Ranked", "Classement"]);
    expect(await screen.findByText("Déconnecté")).toBeInTheDocument();
  });

  test("a failed sign-out keeps the User, and says so", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ message: "down" }, { status: 500 })),
    );

    const { user } = await renderApp(ada);

    await user.click(screen.getByRole("button", { name: "Menu de ada" }));
    await user.click(await screen.findByRole("menuitem", { name: "Se déconnecter" }));

    expect(await screen.findByText("La déconnexion a échoué. Réessaie.")).toBeInTheDocument();
    expect(within(sidebar()).getByRole("button", { name: "Menu de ada" })).toBeVisible();
  });
});

describe("the Visitor's card", () => {
  test("invites them to sign in, and opens the sign-in dialog", async () => {
    const { user } = await renderApp(null);

    expect(
      within(sidebar()).getByText(
        "Connecte-toi pour jouer en Duel, entrer au Classement et défier tes Friends.",
      ),
    ).toBeInTheDocument();

    await user.click(within(sidebar()).getByRole("button", { name: "Se connecter" }));

    expect(useAuthStore.getState().signInOpen).toBe(true);
  });
});

describe("the sidebar in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test("names the sidebar and its nav, and a Visitor's pages", async () => {
    await renderApp(null);

    expect(screen.getByRole("complementary", { name: "Sidebar" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Main navigation" }))
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Play", "Ranked", "Leaderboard"]);
  });

  test("invites a Visitor to sign in", async () => {
    await renderApp(null);

    const englishSidebar = screen.getByRole("complementary", { name: "Sidebar" });

    expect(
      within(englishSidebar).getByText(
        "Sign in to play Duels, join the Leaderboard and challenge your Friends.",
      ),
    ).toBeInTheDocument();
    expect(within(englishSidebar).getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(within(englishSidebar).getByRole("link", { name: /^Theme / })).toBeInTheDocument();
  });

  test("names the Theme chosen in English", async () => {
    useThemeStore.getState().setTheme("lagoon");
    await renderApp(null);

    expect(
      within(screen.getByRole("complementary", { name: "Sidebar" })).getByRole("link", {
        name: "Theme Lagoon",
      }),
    ).toBeInTheDocument();
  });

  test("says the User is signed out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: true })),
    );

    const { user } = await renderApp(ada);

    await user.click(screen.getByRole("button", { name: "Menu for ada" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByText("Signed out")).toBeInTheDocument();
  });

  test("says when signing out fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ message: "down" }, { status: 500 })),
    );

    const { user } = await renderApp(ada);

    await user.click(screen.getByRole("button", { name: "Menu for ada" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByText("Sign-out failed. Try again.")).toBeInTheDocument();
  });

  test("a User's pages, their Friend requests counted in the singular and the plural", async () => {
    await renderApp(ada);

    const englishNav = screen.getByRole("navigation", { name: "Main navigation" });

    expect(
      within(englishNav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Play", "Ranked", "Leaderboard", "History", "Friends", "Profile"]);

    act(() =>
      sockets.server().receive({ type: "friends-snapshot", presences: [], requestsReceived: 1 }),
    );
    expect(within(englishNav).getByLabelText("1 Friend request")).toHaveTextContent("1");

    act(() =>
      sockets.server().receive({ type: "friends-snapshot", presences: [], requestsReceived: 2 }),
    );
    expect(within(englishNav).getByLabelText("2 Friend requests")).toHaveTextContent("2");
  });

  test("the User's card, their Place and their menu", async () => {
    const { user } = await renderApp({
      ...withRank({ tier: "diamond", division: 2, tp: 83, shielded: false }),
      place: 51,
    });

    const englishCard = screen.getByRole("button", { name: "Menu for ada" });

    expect(within(englishCard).getByText("51st worldwide")).toBeInTheDocument();

    await user.click(englishCard);

    expect(await screen.findByRole("menuitem", { name: /^My Leaderboard Place/ })).toHaveAttribute(
      "href",
      "/leaderboard?at=me",
    );
    expect(screen.getByRole("menuitem", { name: "My Profile" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Handle settings" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
  });

  test("the Friends online, the Queue's hint, and the way to all of them", async () => {
    usePlayStore.setState({ play: "duel" });
    await renderApp(ada, "/", [friend("grace"), friend("mary"), friend("alan")]);

    expect(screen.getByRole("status", { name: "Loading Friends online" })).toBeInTheDocument();

    tellPresences([
      ["grace", "online"],
      ["alan", "in-duel"],
    ]);
    act(() => sockets.server().receive({ type: "queued" }));

    const online = screen.getByRole("region", { name: "Online · 2" });

    expect(
      within(online)
        .getAllByRole("listitem")
        .map((row) => within(row).getByText(/^(online|in a Duel)$/).textContent),
    ).toEqual(["online", "in a Duel"]);

    expect(
      within(online).getByText("Challenge them without leaving the Queue."),
    ).toBeInTheDocument();
    expect(within(online).getByRole("link", { name: "All your Friends · 3" })).toBeInTheDocument();

    act(() => {
      sockets.server().receive({ type: "presence", userId: "grace-id", presence: "offline" });
      sockets.server().receive({ type: "presence", userId: "alan-id", presence: "offline" });
    });

    expect(within(online).getByText("No Friends online")).toBeInTheDocument();
  });
});

const duelFound: ServerMessage = {
  type: "duel-found",
  duel: {
    id: "duel-1",
    seed: 42,
    language: "en",
    wordListVersion: 1,
    seconds: 30,
    startsAt: 3_000,
  },
  opponent: { handle: "grace", image: null, ornament: null },
  selfOrnament: null,
  serverTime: 0,
  pace: 40,
  opponentPace: 40,
  selfRank: null,
  opponentRank: null,
  selfForm: null,
  opponentForm: null,
  selfStake: null,
};

const localeSwitch = () => screen.getByRole("button", { name: /^(Langue|Language)/, hidden: true });

// Presses Tab until `target` has the focus, `presses` times at most.
const tabTo = async (
  user: ReturnType<typeof userEvent.setup>,
  target: () => HTMLElement,
  presses = 30,
): Promise<void> => {
  if (presses === 0 || document.activeElement === target()) {
    return;
  }

  await user.tab();

  return tabTo(user, target, presses - 1);
};

describe("the Locale switch", () => {
  afterEach(() => {
    useDuelStore.setState(useDuelStore.getInitialState());
  });

  test("says the Locale shown and the one it proposes, each in its own language", async () => {
    await renderApp(null);

    expect(localeSwitch()).toHaveAccessibleName("Langue : Français. Passer en English");
    expect(within(localeSwitch()).getByText("Français")).toHaveAttribute("lang", "fr");
    expect(within(localeSwitch()).getByText("English")).toHaveAttribute("lang", "en");
  });

  test("in English, proposes Français", async () => {
    useLocaleStore.setState({ locale: "en" });
    await renderApp(null);

    expect(localeSwitch()).toHaveAccessibleName("Language: English. Switch to Français");
  });

  test("is reached with Tab, for everyone", async () => {
    const { user } = await renderApp(ada);

    await tabTo(user, localeSwitch);

    expect(localeSwitch()).toHaveFocus();
    expect(localeSwitch()).toBeEnabled();
  });

  test("is disabled from the Countdown to the end of the Duel", async () => {
    await renderApp(ada, "/leaderboard");

    act(() => {
      useDuelStore.getState().enter(() => 0);
      sockets.server().receive({ type: "queued" });
    });
    expect(localeSwitch()).toBeEnabled();

    act(() => sockets.server().receive(duelFound));
    expect(localeSwitch()).toBeDisabled();

    act(() => useDuelStore.getState().tick(3_000));
    expect(useDuelStore.getState().state.phase).toBe("running");
    expect(localeSwitch()).toBeDisabled();
  });
});

describe("the Rail, below 1440 px", () => {
  beforeEach(() => setViewportWidth(1280));

  afterEach(() => setViewportWidth(1440));

  test("folds the sidebar, its entries still named, each named again in a tooltip", async () => {
    const { user } = await renderApp(ada);

    expect(sidebar()).toHaveAttribute("data-rail");
    expect(navLinks()).toEqual([
      "Jouer",
      "Ranked",
      "Classement",
      "Historique",
      "Friends",
      "Profil",
    ]);

    await user.hover(within(nav()).getByRole("link", { name: "Classement" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Classement");
  });

  test("unfolds once the window is 1440 px wide, and folds again below", async () => {
    await renderApp(ada);

    setViewportWidth(1440);
    expect(sidebar()).not.toHaveAttribute("data-rail");

    setViewportWidth(1439);
    expect(sidebar()).toHaveAttribute("data-rail");
  });

  test("the brand keeps its name, the symbol alone", async () => {
    await renderApp(ada);

    expect(within(sidebar()).getByRole("link", { name: "typomaniac" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("the Friends online as avatars, each named in its tooltip, then how many more", async () => {
    const handles = ["a1", "a2", "a3", "a4", "a5", "a6", "a7"];
    const { user } = await renderApp(ada, "/leaderboard", [...handles, "off"].map(friend));

    tellPresences(handles.map((handle) => [handle, "online"]));

    expect(onlineSection()).toHaveAccessibleName("En ligne · 7");
    expect(within(onlineSection()).getAllByRole("listitem")).toHaveLength(5);
    expect(within(onlineSection()).queryByRole("button", { name: /Défier/ })).toBeNull();

    const more = within(onlineSection()).getByRole("link", { name: "Tous tes Friends · 8" });

    expect(more).toHaveTextContent("+2");
    expect(more).toHaveAttribute("href", "/friends");

    const first = within(onlineSection()).getByRole("link", { name: "@a1" });

    expect(first).toHaveAttribute("href", "/u/a1");

    await user.hover(first);

    expect(await screen.findByRole("tooltip")).toHaveTextContent("@a1 · en ligne");
  });

  test("no more to count, no count", async () => {
    await renderApp(ada, "/leaderboard", [friend("grace"), friend("off")]);
    tellPresences([["grace", "in-duel"]]);

    expect(within(onlineSection()).getAllByRole("listitem")).toHaveLength(1);
    expect(within(onlineSection()).queryByRole("link", { name: /Tous tes Friends/ })).toBeNull();
  });

  test("the Locale, the Theme and the User's menu keep their names", async () => {
    const { user } = await renderApp(ada);

    expect(
      within(sidebar()).getByRole("button", { name: "Langue : Français. Passer en English" }),
    ).toBeInTheDocument();
    expect(within(sidebar()).getByRole("link", { name: /^Thème/ })).toHaveAttribute(
      "href",
      "/themes",
    );

    await user.click(within(sidebar()).getByRole("button", { name: "Menu de ada" }));

    expect(await screen.findByRole("menuitem", { name: "Mon Profile" })).toBeInTheDocument();
  });

  test("the User's menu opens from their avatar, wearing their Ornament", async () => {
    await renderApp({ ...ada, ornament: "gold", ornamentChoice: "follow" });

    const menu = within(sidebar()).getByRole("button", { name: "Menu de ada" });

    expect(within(menu).getByText("A")).toBeInTheDocument();
    expect(menu.querySelector("[data-ornament]")).not.toBeNull();
  });

  test("a Visitor signs in from an icon, named", async () => {
    const { user } = await renderApp(null);

    await user.click(within(sidebar()).getByRole("button", { name: "Se connecter" }));

    expect(useAuthStore.getState().signInOpen).toBe(true);
  });

  test("the whole sidebar has no tooltip", async () => {
    setViewportWidth(1440);
    const { user } = await renderApp(ada);

    await user.hover(within(nav()).getByRole("link", { name: "Classement" }));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

describe("the sidebar during a Solo Run", () => {
  let gsapClock: ReturnType<typeof holdGsapClock>;

  beforeEach(() => {
    useRunStore.getState().start(words10);
    gsapClock = holdGsapClock();
  });

  afterEach(() => {
    gsapClock.release();
    vi.restoreAllMocks();
  });

  test("is whole before the first Keystroke", async () => {
    await renderApp(null, "/run");

    expect(sidebar()).not.toHaveAttribute("data-rail");
  });

  test("folds into its Rail at the first Keystroke, its icons still there, then unfolds at the Result", async () => {
    const { user } = await renderApp(null, "/run");

    await user.keyboard("s");

    expect(sidebar()).toHaveAttribute("data-rail");
    expect(sidebar()).not.toHaveAttribute("inert");
    expect(within(nav()).getByRole("link", { name: "Classement" })).toBeInTheDocument();
    // Its width shrinks to the Rail's.
    expect(sidebar().style.width).not.toBe("");

    gsapClock.advance(FOLD_SECONDS);

    expect(sidebar().getAttribute("style") ?? "").toBe("");

    await user.keyboard(text.slice(1));

    expect(await screen.findByRole("button", { name: /Rejouer/ })).toBeInTheDocument();
    expect(sidebar()).not.toHaveAttribute("data-rail");
    expect(sidebar().style.width).not.toBe("");

    gsapClock.advance(FOLD_SECONDS);

    expect(sidebar().getAttribute("style") ?? "").toBe("");
  });

  test("unfolds as the Run is dropped for the next one, Tab then Enter", async () => {
    const { user } = await renderApp(null, "/run");

    await user.keyboard("s");
    gsapClock.advance(FOLD_SECONDS);

    expect(sidebar()).toHaveAttribute("data-rail");

    await user.keyboard("{Tab}{Enter}");

    expect(sidebar()).not.toHaveAttribute("data-rail");

    gsapClock.advance(FOLD_SECONDS);

    expect(sidebar().getAttribute("style") ?? "").toBe("");
  });

  test("below 1440 px, stays the Rail it is, without moving", async () => {
    setViewportWidth(1280);

    try {
      const { user } = await renderApp(null, "/run");

      await user.keyboard("s");

      expect(sidebar()).toHaveAttribute("data-rail");
      expect(sidebar().getAttribute("style") ?? "").toBe("");
    } finally {
      setViewportWidth(1440);
    }
  });

  test("under reduced motion, folds and unfolds at once", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      matches: media === "(prefers-reduced-motion: reduce)",
      media,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }));

    const { user } = await renderApp(null, "/run");

    await user.keyboard("s");

    expect(sidebar()).toHaveAttribute("data-rail");
    expect(sidebar().getAttribute("style") ?? "").toBe("");

    await user.keyboard(text.slice(1));
    await screen.findByRole("button", { name: /Rejouer/ });

    expect(sidebar()).not.toHaveAttribute("data-rail");
    expect(sidebar().getAttribute("style") ?? "").toBe("");
  });

  test("stays whole on another page, a Run left there unfinished", async () => {
    useRunStore.getState().press({ kind: "char", char: "s" }, 1_000, defaultPace);
    await renderApp(null, "/leaderboard");

    expect(sidebar()).not.toHaveAttribute("data-rail");
  });
});
