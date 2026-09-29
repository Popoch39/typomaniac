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
import { StrictMode } from "react";
import { defaultPace } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";
import { AppFrame } from "@/components/app-frame";
import { useIntroReplayStore } from "@/stores/intro-replay-store";
import { IntroGate } from "@/components/intro/intro-gate";
import { DocumentTheme } from "@/components/theme/document-theme";
import { HomePage } from "@/pages/home-page";
import { IntroDevPage } from "@/pages/intro-dev-page";
import { useIntroStore } from "@/stores/intro-store";
import { useThemeStore } from "@/stores/theme-store";
import { holdGsapClock } from "@/test/gsap-clock";

const ada: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
};

let gsapClock = holdGsapClock();

beforeEach(() => {
  gsapClock = holdGsapClock();
});

afterEach(() => {
  gsapClock.release();
  useIntroStore.setState(useIntroStore.getInitialState());
  useIntroReplayStore.setState(useIntroReplayStore.getInitialState());
  useThemeStore.setState(useThemeStore.getInitialState());
});

// The app as main.tsx renders it, the Intro's overlay beside the router, opened on /dev/intro:
// the page loaded long ago, no Intro playing.
const renderPage = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, ada);
  queryClient.setQueryData(paceQueryOptions(ada).queryKey, defaultPace);
  queryClient.setQueryData(friendsQueryOptions.queryKey, []);

  const root = createRootRoute({
    component: () => (
      <>
        <DocumentTheme />
        <AppFrame>
          <Outlet />
        </AppFrame>
      </>
    ),
  });

  const home = createRoute({ getParentRoute: () => root, path: "/", component: HomePage });

  const page = createRoute({
    getParentRoute: () => root,
    path: "/dev/intro",
    component: IntroDevPage,
  });

  const router = createRouter({
    routeTree: root.addChildren([home, page]),
    history: createMemoryHistory({ initialEntries: ["/dev/intro"] }),
  });

  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <IntroGate />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );

  await screen.findByRole("heading", { level: 1, name: "Intro" });
};

const choose = async (setting: string, option: string) =>
  userEvent.click(
    within(screen.getByRole("group", { name: setting })).getByRole("button", { name: option }),
  );

// Replays the Intro, then waits for the home page it leads to, and for the lockup's fonts.
const replay = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Rejouer" }));
  await screen.findByLabelText("Zone de frappe");
  await act(() => Promise.resolve());
};

const intro = () => document.querySelector("[data-intro='overlay']");

const typed = () =>
  Array.from(document.querySelectorAll("[data-intro='letter'], [data-intro='typo']"))
    .filter((letter) => getComputedStyle(letter).display !== "none")
    .map((letter) => letter.textContent)
    .join("");

const fps = () => screen.queryByRole("status", { name: "Images par seconde" });

describe("IntroDevPage", () => {
  test("replayed with the shell 2 s late, the Intro plays on the home page, the caret waiting up to 2 s", async () => {
    await renderPage();
    await choose("Shell prêt", "2 s");
    await replay();

    expect(intro()).toBeInTheDocument();

    gsapClock.advance(2.62 + 1.9);
    expect(intro()).toBeInTheDocument();
    expect(typed()).toBe("typomaniac");

    gsapClock.advance(1.2);
    expect(intro()).not.toBeInTheDocument();
    expect(screen.getByLabelText("Zone de frappe")).toHaveFocus();
  });

  test("replayed at 2×, the Intro plays in half its time; the next page start plays at its own pace", async () => {
    await renderPage();
    await choose("Vitesse", "2×");
    await replay();

    gsapClock.advance(1.25);
    expect(intro()).toBeInTheDocument();
    gsapClock.advance(0.35);
    expect(intro()).not.toBeInTheDocument();

    // As main.tsx starts it, without the page's options.
    act(() => useIntroStore.getState().play());
    await act(() => Promise.resolve());
    gsapClock.advance(1);

    expect(typed()).toBe("t");
  });

  test("the frame rate shows over a replayed Intro, until its end", async () => {
    await renderPage();

    expect(fps()).not.toBeInTheDocument();

    await replay();
    expect(fps()).toHaveTextContent("fps");

    gsapClock.advance(3.2);
    expect(intro()).not.toBeInTheDocument();
    expect(fps()).not.toBeInTheDocument();
  });

  test("offers the eight Themes, the one chosen applied at once", async () => {
    await renderPage();

    const themes = within(screen.getByRole("group", { name: "Theme" })).getAllByRole("button");

    expect(themes.map((theme) => theme.textContent)).toEqual([
      "Corail",
      "Lagon",
      "Matcha",
      "Lilas",
      "Sakura",
      "Arcade",
      "Craie",
      "Papier",
    ]);

    await choose("Theme", "Papier");

    expect(document.documentElement).toHaveAttribute("data-theme", "paper");
  });

  test("replayed at 0,25×, the typing has not reached « typoman » after 4 s", async () => {
    await renderPage();
    await choose("Vitesse", "0,25×");
    await replay();

    gsapClock.advance(4);

    expect(typed()).toBe("t");
  });
});
