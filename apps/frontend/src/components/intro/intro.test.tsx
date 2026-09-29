import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { StrictMode } from "react";
import { defaultPace } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type HandleAvailability, handleAvailabilityQueryOptions } from "@/api/handle";
import { type Me, meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";
import { AppFrame } from "@/components/app-frame";
import { HandleChoiceDialog } from "@/components/handle/handle-choice-dialog";
import { IntroGate } from "@/components/intro/intro-gate";
import { readyOnFirstRender } from "@/components/intro/ready-on-first-render";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "@/lib/toast";
import { HomePage } from "@/pages/home-page";
import { RunPage } from "@/pages/run-page";
import { useIntroStore } from "@/stores/intro-store";
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

const free: HandleAvailability = { available: true, handle: "ada" };

let gsapClock = holdGsapClock();

// The page starts on the Run (unless told another) and plays the Intro, as `introAtStartup`
// decides.
beforeEach(() => {
  gsapClock = holdGsapClock();
  useIntroStore.getState().play();
});

afterEach(() => {
  gsapClock.release();
  useIntroStore.setState(useIntroStore.getInitialState());
});

type AppOptions = {
  me?: Me | null;
  shell?: Promise<void>;
  // The page the app opens on: the home page, unless said.
  at?: string;
  // What the Leaderboard's loader waits on, as its data.
  leaderboardData?: Promise<void>;
};

// The app as main.tsx and the root route render it: the Intro's overlay beside the router, the
// frame, the home page or the Leaderboard (a page with a loader and no parts of its own), the
// Handle choice and the toasts. The shell mounts once `shell` resolves, as it waits for `/me` in
// the app; at once without it.
const renderApp = ({ me = ada, shell, at = "/run", leaderboardData }: AppOptions = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(paceQueryOptions(me).queryKey, defaultPace);
  queryClient.setQueryData(friendsQueryOptions.queryKey, []);
  // The Handle suggested to a User without one, free: its live check makes no request.
  queryClient.setQueryData(handleAvailabilityQueryOptions("ada").queryKey, free);

  const root = createRootRoute({
    beforeLoad: () => shell,
    component: () => (
      <>
        <AppFrame>
          <Outlet />
        </AppFrame>
        <HandleChoiceDialog />
        <Toaster />
      </>
    ),
  });

  const home = createRoute({ getParentRoute: () => root, path: "/", component: HomePage });

  const run = createRoute({ getParentRoute: () => root, path: "/run", component: RunPage });

  const leaderboard = createRoute({
    getParentRoute: () => root,
    path: "/leaderboard",
    loader: () => leaderboardData,
    component: () => <h1>Leaderboard</h1>,
  });

  const router = createRouter({
    routeTree: root.addChildren([home, run, leaderboard]),
    history: createMemoryHistory({ initialEntries: [at] }),
  });

  readyOnFirstRender(router);

  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <IntroGate />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );

  return { router };
};

// A shell that mounts when the test says, as when `/me` is slow.
const heldShell = () => {
  let open: (() => void) | null = null;

  const shell = new Promise<void>((resolve) => {
    open = resolve;
  });

  return { shell, mount: () => act(async () => open?.()) };
};

// The landing, from the waiting point to the last part of the page in place: about 2.1 s.
const LANDING_S = 2.2;

// The whole Intro, the shell there all along: the typing to its waiting point, then the landing.
const OVER_S = 2.62 + LANDING_S;

// The fonts of the lockup load (at once here), then the typing starts on GSAP's clock.
const fontsLoaded = () => act(() => Promise.resolve());

const intro = () => document.querySelector("[data-intro='overlay']");

const shown = (element: Element) => {
  const style = getComputedStyle(element);

  return style.display !== "none" && style.opacity !== "0";
};

// The letters of the word on screen, typo included.
const typed = () =>
  Array.from(document.querySelectorAll("[data-intro='letter'], [data-intro='typo']"))
    .filter(shown)
    .map((letter) => letter.textContent)
    .join("");

// The app's frame, around the sidebar and the page.
const frame = () => screen.getByLabelText("Barre latérale").parentElement;

const sidebar = () => screen.getByLabelText("Barre latérale");

// The parts of the shell the landing moves, by their `data-intro`.
const shellParts = (name: string) =>
  Array.from(document.querySelectorAll(`[data-intro='${name}']`));

// Everything the landing moves: the sidebar, its brand (Logo, wave, word), its nav, its Friends
// online and its foot, and the page's parts, or the page itself as one block.
const moved = () => [
  sidebar(),
  ...sidebar().querySelectorAll("[data-logo]"),
  ...shellParts("brand-word"),
  ...shellParts("nav"),
  ...shellParts("online"),
  ...shellParts("foot"),
  ...shellParts("part"),
  ...shellParts("page"),
];

// What the landing left inline on the shell, element by element: nothing once the Intro is over,
// its classes alone.
const leftInline = () => moved().map((element) => element.getAttribute("style") ?? "");

const nothingInline = () => moved().map(() => "");

const resumePrompt = () => screen.queryByRole("button", { name: "clique ou tape pour reprendre" });

const caretShown = () => {
  const caret = document.querySelector("[data-intro='caret']");

  return caret !== null && shown(caret);
};

describe("the Intro, as the Run's page starts", () => {
  test("at the first render, the Logo alone waits over the Theme's ink, silent", () => {
    renderApp({ shell: new Promise(() => {}) });

    expect(intro()).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector("[data-intro='logo']")).toBeInTheDocument();
    expect(typed()).toBe("");
    expect(caretShown()).toBe(false);
  });

  test("the word is typed at the board's times, its typo taken back", async () => {
    renderApp();
    await fontsLoaded();

    gsapClock.advance(0.78);
    expect(caretShown()).toBe(false);
    gsapClock.advance(0.1);
    expect(caretShown()).toBe(true);
    expect(typed()).toBe("");
    gsapClock.advance(0.1);
    expect(typed()).toBe("t");
    gsapClock.advance(0.42);
    expect(typed()).toBe("typoman");
    gsapClock.advance(0.1);
    expect(typed()).toBe("typomana");
    gsapClock.advance(0.05);
    expect(typed()).toBe("typomanai");
    gsapClock.advance(0.1);
    expect(caretShown()).toBe(false);
    gsapClock.advance(0.12);
    expect(caretShown()).toBe(true);
    gsapClock.advance(0.13);
    expect(typed()).toBe("typomana");
    gsapClock.advance(0.08);
    expect(typed()).toBe("typoman");
    gsapClock.advance(0.3);
    expect(typed()).toBe("typomaniac");
  });

  test("each letter rises in as it is typed, and the typo fades out before it is erased", async () => {
    renderApp();
    await fontsLoaded();

    const [first] = document.querySelectorAll<HTMLElement>("[data-intro='letter']");
    const [, lastOfTypo] = document.querySelectorAll<HTMLElement>("[data-intro='typo']");

    gsapClock.advance(0.97);
    expect(Number(first?.style.opacity)).toBeGreaterThan(0);
    expect(Number(first?.style.opacity)).toBeLessThan(1);
    gsapClock.advance(0.1);
    expect(first?.style.opacity).toBe("1");

    gsapClock.advance(1.86 - 1.07);
    expect(lastOfTypo?.style.display).toBe("inline-block");
    expect(Number(lastOfTypo?.style.opacity)).toBeLessThan(1);
    gsapClock.advance(0.03);
    expect(lastOfTypo?.style.display).toBe("none");
  });

  test("the shell not there at the end of the typing, the caret blinks until it is", async () => {
    const { shell, mount } = heldShell();

    renderApp({ shell });
    await fontsLoaded();

    gsapClock.advance(2.68);
    expect(caretShown()).toBe(false);
    gsapClock.advance(0.2);
    expect(caretShown()).toBe(true);
    gsapClock.advance(0.4);
    expect(caretShown()).toBe(false);
    gsapClock.advance(0.2);
    expect(caretShown()).toBe(true);
    gsapClock.advance(5);
    expect(intro()).toBeInTheDocument();
    expect(typed()).toBe("typomaniac");

    await mount();
    await screen.findByLabelText("Zone de frappe");
    gsapClock.advance(0.63 + LANDING_S);

    expect(intro()).not.toBeInTheDocument();
  });

  test("a start that fails ends the Intro at its waiting point, on the error", async () => {
    renderApp({ shell: Promise.reject(new Error("/me failed")) });
    await fontsLoaded();

    gsapClock.advance(2.5);
    expect(intro()).toBeInTheDocument();
    gsapClock.advance(0.7);

    expect(intro()).not.toBeInTheDocument();
  });

  test("once over, the overlay is gone and the app is there, the focus on the typing", async () => {
    renderApp();
    await fontsLoaded();

    const input = await screen.findByLabelText("Zone de frappe");

    expect(frame()).toHaveAttribute("inert");
    expect(input).not.toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();

    gsapClock.advance(OVER_S);

    expect(intro()).not.toBeInTheDocument();
    expect(frame()).not.toHaveAttribute("inert");
    expect(input).toHaveFocus();
  });

  test("the Handle choice of a User without one opens once the Intro is over", async () => {
    renderApp({ me: { ...ada, handle: null } });
    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    gsapClock.advance(OVER_S);

    expect(await screen.findByRole("dialog", { name: "Choisis ton Handle" })).toBeInTheDocument();
  });

  test("a toast shown before the app is there appears once the Intro is over", async () => {
    const { shell, mount } = heldShell();

    renderApp({ shell });
    await fontsLoaded();
    toast.success("Te revoilà");
    await mount();
    await screen.findByLabelText("Zone de frappe");
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));

    expect(screen.queryByText("Te revoilà")).not.toBeInTheDocument();

    gsapClock.advance(OVER_S);

    expect(await screen.findByText("Te revoilà")).toBeInTheDocument();
  });

  test("a key typed during the Intro starts no Run", async () => {
    const user = userEvent.setup();

    renderApp();
    await fontsLoaded();

    const input = await screen.findByLabelText("Zone de frappe");

    gsapClock.advance(1);
    await user.keyboard("s");

    expect(input).not.toHaveFocus();

    gsapClock.advance(2.2);

    expect(screen.getByRole("group", { name: "Réglages" })).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: "temps restant" })).toHaveTextContent("30");
  });

  test("back on the Run from another page, no Intro plays again", async () => {
    const { router } = renderApp();

    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");
    gsapClock.advance(OVER_S);

    await act(() => router.navigate({ to: "/leaderboard" }));
    await act(() => router.navigate({ to: "/run" }));

    expect(await screen.findByLabelText("Zone de frappe")).toHaveFocus();
    expect(intro()).not.toBeInTheDocument();
    expect(frame()).not.toHaveAttribute("inert");
  });
});

describe("the Intro's landing into the sidebar", () => {
  test("the shell there at the waiting point, the lockup dives into the sidebar and the app follows", async () => {
    renderApp();
    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");
    gsapClock.advance(2.62 + 0.5);

    expect(intro()).toBeInTheDocument();
    expect(frame()).toHaveAttribute("inert");
    // The User's six items of nav, the page's five parts, the Friends online, the foot.
    expect(shellParts("nav")).toHaveLength(6);
    expect(shellParts("part")).toHaveLength(5);
    expect(shellParts("online")).toHaveLength(1);
    expect(shellParts("foot")).toHaveLength(1);

    gsapClock.advance(LANDING_S);

    expect(intro()).not.toBeInTheDocument();
  });

  test("on Jouer, its title and its three cards land one after the other", async () => {
    renderApp({ at: "/" });
    await fontsLoaded();
    await screen.findByRole("heading", { level: 1, name: "Choisis ton mode" });
    gsapClock.advance(2.62 + 0.5);

    expect(shellParts("part")).toHaveLength(4);

    gsapClock.advance(LANDING_S);

    expect(intro()).not.toBeInTheDocument();
    expect(leftInline()).toEqual(nothingInline());
  });

  test("for a Visitor, the three items of nav land, and no Friends online", async () => {
    renderApp({ me: null });
    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");
    gsapClock.advance(2.62 + 0.5);

    expect(shellParts("nav")).toHaveLength(3);
    expect(shellParts("online")).toHaveLength(0);
    expect(shellParts("foot")).toHaveLength(1);

    gsapClock.advance(LANDING_S);

    expect(intro()).not.toBeInTheDocument();
    expect(leftInline()).toEqual(nothingInline());
  });

  test("once landed, the sidebar and the page are theirs again, the sidebar fading while a Run is typed", async () => {
    const user = userEvent.setup();

    renderApp();
    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");
    gsapClock.advance(OVER_S);

    expect(leftInline()).toEqual(nothingInline());

    await user.keyboard("s");

    expect(sidebar()).toHaveAttribute("data-faded");
  });

  test("the window resized during the landing, the Intro jumps to its end", async () => {
    renderApp();
    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");
    gsapClock.advance(2.62 + 0.6);

    expect(intro()).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(intro()).not.toBeInTheDocument();
    expect(leftInline()).toEqual(nothingInline());
  });
});

describe("the Intro, as another page starts", () => {
  test("the lockup lands in the sidebar and the page comes in as one block", async () => {
    renderApp({ at: "/leaderboard" });
    await fontsLoaded();
    await screen.findByRole("heading", { name: "Leaderboard" });
    gsapClock.advance(2.62 + 0.5);

    expect(intro()).toBeInTheDocument();
    expect(frame()).toHaveAttribute("inert");
    expect(shellParts("part")).toHaveLength(0);
    expect(shellParts("page")).toHaveLength(1);
    expect(shellParts("nav")).toHaveLength(6);

    gsapClock.advance(LANDING_S);

    expect(intro()).not.toBeInTheDocument();
    expect(frame()).not.toHaveAttribute("inert");
    expect(leftInline()).toEqual(nothingInline());
  });

  test("on an address no route answers, the lockup lands on the page not found, in the shell", async () => {
    renderApp({ at: "/nulle-part" });
    await fontsLoaded();
    await screen.findByLabelText("Barre latérale");
    gsapClock.advance(2.62 + 0.5);

    expect(intro()).toBeInTheDocument();
    expect(shellParts("page")).toHaveLength(1);

    gsapClock.advance(LANDING_S);

    expect(intro()).not.toBeInTheDocument();
    expect(leftInline()).toEqual(nothingInline());
  });

  test("its data not there at the end of the typing, the caret blinks until the page is", async () => {
    const { shell: data, mount: resolve } = heldShell();

    renderApp({ at: "/leaderboard", leaderboardData: data });
    await fontsLoaded();
    gsapClock.advance(2.62 + 5);

    expect(intro()).toBeInTheDocument();
    expect(typed()).toBe("typomaniac");

    await resolve();
    await screen.findByRole("heading", { name: "Leaderboard" });
    gsapClock.advance(0.63 + LANDING_S);

    expect(intro()).not.toBeInTheDocument();
  });
});
