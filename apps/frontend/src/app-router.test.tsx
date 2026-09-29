import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { defaultPace } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";
import { createAppRouter } from "@/app-router";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { useLocaleStore } from "@/stores/locale-store";
import { fakeServer, idle } from "@/test/fake-socket";

const storageKey = "typomaniac-locale";

const keep = (chosen: string) =>
  localStorage.setItem(storageKey, JSON.stringify({ state: { chosen }, version: 1 }));

const kept = () => JSON.parse(localStorage.getItem(storageKey) ?? "null")?.state?.chosen ?? null;

// Blocked site data: any access to the storage throws.
const blocked = (): Storage => {
  throw new DOMException("Blocked", "SecurityError");
};

type Visit = {
  languages?: readonly string[];
  storage?: () => Storage;
};

// The cache as the root route's beforeLoad leaves it, for a Visitor.
const visitorCache = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, null);
  queryClient.setQueryData(paceQueryOptions(null).queryKey, defaultPace);

  return queryClient;
};

// The app's router opened at `path`, as a browser whose languages are `languages` would.
const visit = (path: string, { languages = [], storage = () => localStorage }: Visit = {}) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  const queryClient = visitorCache();
  const router = createAppRouter({ history, storage, languages, queryClient });

  return { router, history, queryClient, url: () => history.location.href };
};

const shown = () => useLocaleStore.getState().locale;

// The whole app at `path`, for a Visitor.
const renderApp = async (path: string) => {
  const opened = visit(path);

  await act(() => opened.router.load());
  render(
    <QueryClientProvider client={opened.queryClient}>
      <RouterProvider router={opened.router} />
    </QueryClientProvider>,
  );
  await screen.findByRole("complementary", { name: /^(Barre latérale|Sidebar)$/ });

  return { ...opened, user: userEvent.setup() };
};

// The whole app at `path` with nothing read yet: the root route asks the API for `/me` itself.
const renderAppWithoutCache = async (path: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
    storage: () => localStorage,
    languages: [],
    queryClient,
  });

  await act(() => router.load());
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("a URL without a Locale", () => {
  test("leads to the Locale kept by this browser", () => {
    keep("en");

    expect(visit("/", { languages: ["fr"] }).url()).toBe("/en");
    expect(shown()).toBe("en");
  });

  test("an old link too, rather than to the browser's language", () => {
    keep("en");

    expect(visit("/leaderboard", { languages: ["fr"] }).url()).toBe("/en/leaderboard");
  });

  test("else to the browser's language: French when it comes before English", () => {
    expect(visit("/leaderboard", { languages: ["de", "fr"] }).url()).toBe("/fr/leaderboard");
    expect(shown()).toBe("fr");
  });

  test("else to English, when the browser speaks neither", () => {
    expect(visit("/leaderboard", { languages: ["de"] }).url()).toBe("/en/leaderboard");
  });

  test("keeps the same page, its search and its hash", () => {
    expect(visit("/u/ada?error=x#top", { languages: ["fr"] }).url()).toBe("/fr/u/ada?error=x#top");
  });
});

describe("a URL with a Locale", () => {
  test("opens in its Locale, without changing the one kept", () => {
    keep("en");

    expect(visit("/fr/u/ada").url()).toBe("/fr/u/ada");
    expect(shown()).toBe("fr");
    expect(kept()).toBe("en");
  });

  test("is kept at the first visit, when no Locale is yet", () => {
    visit("/en/ranked", { languages: ["fr"] });

    expect(kept()).toBe("en");
  });

  test("leads the router to the page without its Locale, and every URL it writes has it", () => {
    const { router, history } = visit("/en/u/ada");

    expect(router.parseLocation(history.location).pathname).toBe("/u/ada");
    expect(router.buildLocation({ to: "/leaderboard" }).publicHref).toBe("/en/leaderboard");
  });
});

describe("a storage the browser cannot read", () => {
  test("an entry it cannot read counts as none", () => {
    localStorage.setItem(storageKey, "{not json");

    expect(visit("/", { languages: ["fr"] }).url()).toBe("/fr");
  });

  test("a blocked one breaks nothing: the URL's Locale…", () => {
    expect(visit("/en/ranked", { storage: blocked, languages: ["fr"] }).url()).toBe("/en/ranked");
    expect(shown()).toBe("en");
  });

  test("…else the browser's", () => {
    expect(visit("/", { storage: blocked, languages: ["fr"] }).url()).toBe("/fr");
    expect(shown()).toBe("fr");
  });
});

describe("until English opens, in a production build", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", false);
  });

  test("every URL leads to French, English ones included", () => {
    expect(visit("/en/leaderboard", { languages: ["en"] }).url()).toBe("/fr/leaderboard");
    expect(visit("/", { languages: ["en"] }).url()).toBe("/fr");
    expect(shown()).toBe("fr");
  });

  test("nothing is kept, for the browser's language to count once English opens", () => {
    visit("/", { languages: ["en"] });

    expect(kept()).toBeNull();
  });
});

describe("switching the Locale", () => {
  let sockets = fakeServer();

  beforeEach(() => {
    sockets = fakeServer();
    useConnectionStore.getState().open(sockets.open);
    sockets.server().receive(idle());
  });

  afterEach(() => {
    useConnectionStore.getState().close();
    useDuelStore.setState(useDuelStore.getInitialState());
  });

  test("keeps the User's place in the Queue, and their wait", async () => {
    const { user } = await renderApp("/fr/ranked");

    act(() => {
      useDuelStore.getState().enter(() => 20_000);
      sockets.server().receive({ type: "queued" });
      sockets.server().receive({
        type: "queue-status",
        joinedAt: 10_000,
        serverTime: 17_000,
        size: 3,
        estimatedWait: 12_000,
      });
    });

    const queued = useDuelStore.getState().state;

    await user.click(screen.getByRole("button", { name: "Langue : Français. Passer en English" }));
    await screen.findByRole("complementary", { name: "Sidebar" });

    expect(useDuelStore.getState().state).toBe(queued);
    expect(queued).toEqual({
      phase: "queued",
      queue: { joinedAt: 13_000, size: 3, estimatedWait: 12_000 },
    });
    expect(sockets.server().sent).not.toContainEqual({ type: "leave-queue" });
  });

  test("sets <html lang> from the first render", async () => {
    await renderApp("/en/ranked");

    expect(document.documentElement.lang).toBe("en");
  });

  test("rewrites the prefix of the same page, keeps the choice, and remounts nothing", async () => {
    const { user, url } = await renderApp("/fr/ranked");
    const heading = within(screen.getByRole("main")).getByRole("heading", { level: 1 });

    await user.click(screen.getByRole("button", { name: "Langue : Français. Passer en English" }));

    const sidebar = await screen.findByRole("complementary", { name: "Sidebar" });

    expect(url()).toBe("/en/ranked");
    expect(within(sidebar).getByRole("link", { name: "Leaderboard" })).toHaveAttribute(
      "href",
      "/en/leaderboard",
    );
    expect(document.documentElement.lang).toBe("en");
    expect(kept()).toBe("en");
    expect(heading).toBeInTheDocument();
    expect(sockets.sockets).toHaveLength(1);
    expect(sockets.server().isClosed()).toBe(false);
  });

  test("switches back, in French again", async () => {
    const { user, url } = await renderApp("/en/leaderboard");

    await user.click(screen.getByRole("button", { name: "Language: English. Switch to Français" }));

    expect(await screen.findByRole("complementary", { name: "Barre latérale" })).toBeVisible();
    expect(url()).toBe("/fr/leaderboard");
    expect(kept()).toBe("fr");
  });
});

describe("the screens around every page", () => {
  test("an unknown address says there is no page there, with a way home", async () => {
    await renderApp("/fr/nowhere");

    const main = screen.getByRole("main");

    expect(
      within(main).getByRole("heading", { level: 1, name: "Page introuvable" }),
    ).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: "Retour à l'accueil" })).toHaveAttribute(
      "href",
      "/fr",
    );
  });

  test("an unknown address, in English", async () => {
    await renderApp("/en/nowhere");

    const main = screen.getByRole("main");

    expect(
      within(main).getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      within(main).getByText("This page doesn't exist. The link may be outdated or mistyped."),
    ).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/en",
    );
  });

  test("a page that cannot load says so, and loads again on Réessayer", async () => {
    // The API out of reach at first, then answering: nobody is signed in.
    const fetchApi = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(
        Response.json(
          { error: { code: "UNAUTHORIZED", message: "No Session", requestId: "req-1" } },
          { status: 401 },
        ),
      );

    vi.stubGlobal("fetch", fetchApi);
    await renderAppWithoutCache("/fr/ranked");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Impossible de charger la page" }),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByRole("complementary", { name: "Barre latérale" }),
    ).toBeInTheDocument();
  });

  test("a page that cannot load, in English", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await renderAppWithoutCache("/en/ranked");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Couldn't load this page" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The server can't be reached, or it isn't responding."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  test("below 1024 px, asks to switch to a computer", async () => {
    await renderApp("/fr/ranked");

    expect(
      screen.getByRole("heading", { level: 1, name: "Passe sur ordinateur" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "typomaniac se joue au clavier, sur un écran d'au moins 1024 px de large. Ouvre-le sur ton ordinateur pour taper.",
      ),
    ).toBeInTheDocument();
  });

  test("below 1024 px, in English", async () => {
    await renderApp("/en/ranked");

    expect(
      screen.getByRole("heading", { level: 1, name: "Switch to a computer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "typomaniac is played on a keyboard, on a screen at least 1024 px wide. Open it on your computer to type.",
      ),
    ).toBeInTheDocument();
  });
});
