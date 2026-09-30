import { act, screen, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PILL_CANCEL_SECONDS } from "@/components/search-morph/search-morph-timing";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { useSettingsStore } from "@/stores/settings-store";
import { fakeServer, idle, queueElsewhere } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, renderAppFor } from "@/test/render-app";

// The search folded: the Queue pill, over any page of the tab that joined the Queue.

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the stores outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

const sent = () => server().sentOfPlace();

const sidebar = () => screen.getByRole("complementary", { name: "Barre latérale" });

const sidebarLink = (name: string | RegExp) => within(sidebar()).getByRole("link", { name });

const pill = () => screen.getByRole("region", { name: "Recherche en cours" });

const queryPill = () => screen.queryByRole("region", { name: "Recherche en cours" });

const searchHeading = () => screen.queryByRole("heading", { name: "On te trouve un adversaire…" });

// The Queue as the server tells it at `serverTime`, the User in it since 10 s.
const queueStatus = (
  size: number,
  estimatedWait: number | null,
  serverTime = 17_000,
): ServerMessage => ({
  type: "queue-status",
  joinedAt: 10_000,
  serverTime,
  size,
  estimatedWait,
});

// Ada on Jouer, then in the Queue: she has waited 7 s, on a clock stopped at 0.
const renderQueue = async () => {
  const app = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

  receive(idle());
  await app.user.click(screen.getByRole("button", { name: "Lancer la recherche" }));
  receive({ type: "queued" });
  receive(queueStatus(3, 12_000));

  return app;
};

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  gsapClock = holdGsapClock();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

afterEach(() => {
  gsapClock.release();
  vi.useRealTimers();
  useConnectionStore.getState().close();
  useDuelStore.setState(useDuelStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("the search unfolded on Jouer", () => {
  test("has no Queue pill", async () => {
    await renderQueue();

    expect(searchHeading()).toBeInTheDocument();
    expect(queryPill()).not.toBeInTheDocument();
  });

  test("S'entraîner folds it into the Queue pill and opens the Run on the last settings", async () => {
    useSettingsStore.setState({ mode: "words", words: 50 });

    const { user, url } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "S'entraîner" }));

    expect(url()).toBe("/fr/run");
    expect(await screen.findByLabelText("Zone de frappe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "words" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "50" })).toHaveAttribute("aria-pressed", "true");
    expect(pill()).toBeInTheDocument();
    expect(searchHeading()).not.toBeInTheDocument();
    expect(sent()).toEqual([{ type: "join-queue" }]);
  });

  test("going to another page folds it too", async () => {
    const { user, url } = await renderQueue();

    await user.click(sidebarLink("Friends"));

    expect(url()).toBe("/fr/friends");
    expect(pill()).toBeInTheDocument();
    expect(sent()).toEqual([{ type: "join-queue" }]);
  });
});

describe("the Queue pill", () => {
  test("shows since when the User waits and the Estimated wait, as they change", async () => {
    const { user } = await renderQueue();

    await user.click(sidebarLink("Classement"));

    expect(within(pill()).getByRole("timer", { name: "Temps d'attente" })).toHaveTextContent(
      "0:07",
    );
    expect(within(pill()).getByText("≈ 12 s d'attente")).toBeInTheDocument();

    receive(queueStatus(5, 20_000, 19_000));

    expect(within(pill()).getByRole("timer", { name: "Temps d'attente" })).toHaveTextContent(
      "0:09",
    );
    expect(within(pill()).getByText("≈ 20 s d'attente")).toBeInTheDocument();
  });

  test("shows no Estimated wait without one", async () => {
    const { user } = await renderQueue();

    receive(queueStatus(1, null));
    await user.click(sidebarLink("Classement"));

    expect(within(pill()).queryByText(/d'attente/)).not.toBeInTheDocument();
  });

  test("Agrandir leads back to Jouer, the search unfolded", async () => {
    const { user, url } = await renderQueue();

    await user.click(sidebarLink("Friends"));
    await user.click(within(pill()).getByRole("button", { name: "Agrandir la recherche" }));

    expect(url()).toBe("/fr");
    expect(await screen.findByRole("heading", { name: "On te trouve un adversaire…" }));
    expect(queryPill()).not.toBeInTheDocument();
    expect(sent()).toEqual([{ type: "join-queue" }]);
  });

  test("Annuler leaves the Queue, the Run going on", async () => {
    const { user, url } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "S'entraîner" }));
    await screen.findByLabelText("Zone de frappe");
    await user.keyboard("a");
    await user.click(within(pill()).getByRole("button", { name: "Annuler la recherche" }));

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "leave-queue" }]);

    // It fades out where it is.
    gsapClock.advance(PILL_CANCEL_SECONDS);

    expect(queryPill()).not.toBeInTheDocument();
    expect(url()).toBe("/fr/run");
    expect(screen.getByLabelText("Zone de frappe")).toBeInTheDocument();
    // Still being typed: the Run was neither ended nor drawn again.
    expect(screen.getByLabelText("Barre latérale")).toHaveAttribute("data-faded");
    expect(screen.queryByRole("group", { name: "Réglages" })).not.toBeInTheDocument();
  });

  test("stays whole while the sidebar fades during a Run", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "S'entraîner" }));
    await screen.findByLabelText("Zone de frappe");
    await user.keyboard("a");

    expect(screen.getByLabelText("Barre latérale")).toHaveAttribute("data-faded");
    expect(pill()).toBeInTheDocument();
    expect(pill().closest("[data-faded], [inert]")).toBeNull();
    expect(within(pill()).getByRole("button", { name: "Annuler la recherche" })).toBeEnabled();
  });

  test("is shown in English too", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "Langue : Français. Passer en English" }));
    await user.click(screen.getByRole("button", { name: "Practice" }));

    const englishPill = screen.getByRole("region", { name: "Searching" });

    expect(within(englishPill).getByRole("timer", { name: "Wait time" })).toHaveTextContent("0:07");
    expect(
      within(englishPill).getByRole("button", { name: "Expand the search" }),
    ).toBeInTheDocument();
    expect(
      within(englishPill).getByRole("button", { name: "Cancel the search" }),
    ).toBeInTheDocument();
  });

  test("is not in another tab of the same User", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(100_000);
    await renderAppFor("/fr/leaderboard", { reader: ada, openSocket: sockets.open });

    receive(queueElsewhere(10_000, 22_000));

    expect(await within(sidebar()).findByRole("timer")).toBeInTheDocument();
    expect(queryPill()).not.toBeInTheDocument();
  });
});
