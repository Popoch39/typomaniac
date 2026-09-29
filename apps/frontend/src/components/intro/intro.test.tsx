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
import { readyOnFailedStart } from "@/components/intro/ready-on-failed-start";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "@/lib/toast";
import { HomePage } from "@/pages/home-page";
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

// The page starts on the home page and plays the Intro, as `introAtStartup` decides.
beforeEach(() => {
  gsapClock = holdGsapClock();
  useIntroStore.getState().play();
});

afterEach(() => {
  gsapClock.release();
  useIntroStore.setState(useIntroStore.getInitialState());
});

// The app as main.tsx and the root route render it: the Intro's overlay beside the router, the
// frame, the home page, the Handle choice and the toasts. The shell mounts once `shell` resolves,
// as it waits for `/me` in the app; at once without it.
const renderApp = ({ me = ada, shell }: { me?: Me | null; shell?: Promise<void> } = {}) => {
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

  const leaderboard = createRoute({
    getParentRoute: () => root,
    path: "/leaderboard",
    component: () => null,
  });

  const router = createRouter({
    routeTree: root.addChildren([home, leaderboard]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  readyOnFailedStart(router);

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

const resumePrompt = () => screen.queryByRole("button", { name: "clique ou tape pour reprendre" });

const caretShown = () => {
  const caret = document.querySelector("[data-intro='caret']");

  return caret !== null && shown(caret);
};

describe("the Intro, as the home page starts", () => {
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
    gsapClock.advance(1.2);

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

    gsapClock.advance(3.2);

    expect(intro()).not.toBeInTheDocument();
    expect(frame()).not.toHaveAttribute("inert");
    expect(input).toHaveFocus();
  });

  test("the Handle choice of a User without one opens once the Intro is over", async () => {
    renderApp({ me: { ...ada, handle: null } });
    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    gsapClock.advance(3.2);

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

    gsapClock.advance(3.2);

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

  test("back on the home page from another page, no Intro plays again", async () => {
    const { router } = renderApp();

    await fontsLoaded();
    await screen.findByLabelText("Zone de frappe");
    gsapClock.advance(3.2);

    await act(() => router.navigate({ to: "/leaderboard" }));
    await act(() => router.navigate({ to: "/" }));

    expect(await screen.findByLabelText("Zone de frappe")).toHaveFocus();
    expect(intro()).not.toBeInTheDocument();
    expect(frame()).not.toHaveAttribute("inert");
  });
});
