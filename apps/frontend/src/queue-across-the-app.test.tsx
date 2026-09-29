import { act, screen, waitFor, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { fakeServer, idle, queueElsewhere } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, friend, renderAppFor } from "@/test/render-app";

// The Queue lives across the app (ADR 0012): joined by a gesture, left by Annuler, never by going
// to another page.

const placement = { placementsLeft: 5 };

const opponent = { handle: "kzr_", image: null, ornament: null };

const matchProposed: ServerMessage = {
  type: "match-proposed",
  expiresAt: 10_000,
  serverTime: 0,
  opponent,
  selfOrnament: null,
  selfRank: placement,
  opponentRank: placement,
  selfAccepted: false,
  opponentAccepted: false,
  dodgeLock: null,
};

const duelFound: ServerMessage = {
  type: "duel-found",
  duel: {
    id: "duel-1",
    seed: 42,
    language: "en",
    wordListVersion: 1,
    seconds: 30,
    startsAt: 4_500,
  },
  opponent,
  selfOrnament: null,
  serverTime: 0,
  pace: 50,
  opponentPace: 50,
  selfRank: placement,
  opponentRank: placement,
  selfForm: null,
  opponentForm: null,
  selfStake: null,
};

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the stores outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

const sent = () => server().sent;

const sidebar = () => screen.getByRole("complementary", { name: "Barre latérale" });

const sidebarLink = (name: string | RegExp) => within(sidebar()).getByRole("link", { name });

// The wait shown on the sidebar's Jouer, none outside the Queue.
const sidebarWait = () => within(sidebar()).queryByRole("timer");

// Ada on the play page, then in the Queue: she has waited 7 s, on a clock stopped at 0.
const renderQueue = async (friends = [friend("grace")]) => {
  const app = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open, friends });

  receive(idle());
  await app.user.click(screen.getByRole("button", { name: "duel" }));
  receive({ type: "queued" });
  receive({
    type: "queue-status",
    joinedAt: 10_000,
    serverTime: 17_000,
    size: 3,
    estimatedWait: 12_000,
  });

  return app;
};

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  gsapClock = holdGsapClock();
});

afterEach(() => {
  gsapClock.release();
  vi.useRealTimers();
  useConnectionStore.getState().close();
  useDuelStore.setState(useDuelStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("the Queue follows the User across the app", () => {
  test("Lancer la recherche joins it, once", async () => {
    await renderQueue();

    expect(sent()).toEqual([{ type: "join-queue" }]);
    expect(
      screen.getByRole("heading", { name: "On te trouve un adversaire…" }),
    ).toBeInTheDocument();
  });

  test.each(["Profil", "Classement", "Friends", "Duels", "Ranked"])(
    "going to %s keeps the User in it, with their wait, back on Jouer",
    async (page) => {
      const { user, url } = await renderQueue();

      await user.click(sidebarLink(page));

      expect(url()).not.toBe("/fr");
      expect(sent()).not.toContainEqual({ type: "leave-queue" });

      await user.click(sidebarLink(/^Jouer/));

      expect(
        await screen.findByRole("heading", { name: "On te trouve un adversaire…" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Temps d'attente")).toHaveTextContent("0:07");
      expect(sent()).toEqual([{ type: "join-queue" }]);
    },
  );

  test("Annuler leaves it", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "leave-queue" }]);
    expect(screen.getByRole("button", { name: "solo" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("the sidebar's Jouer", () => {
  test("shows the wait in the tab that plays, on every page", async () => {
    const { user } = await renderQueue();

    expect(sidebarWait()).toHaveAccessibleName("Dans la Queue depuis 0:07");

    await user.click(sidebarLink("Friends"));

    expect(sidebarWait()).toHaveAccessibleName("Dans la Queue depuis 0:07");
    expect(sidebarWait()).toHaveTextContent("0:07");
  });

  test("keeps showing it while a Match proposal waits for an answer, as the other tabs do", async () => {
    await renderQueue();
    receive(matchProposed);
    await screen.findByRole("dialog");

    // Under the modal proposal, the sidebar is out of the accessibility tree.
    const hiddenSidebar = screen.getByLabelText("Barre latérale");

    expect(within(hiddenSidebar).getByRole("timer", { hidden: true })).toHaveAccessibleName(
      "Dans la Queue depuis 0:07",
    );
  });

  test("shows none outside the Queue, nor once it is left", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "Annuler" }));
    receive(idle());

    expect(sidebarWait()).not.toBeInTheDocument();
  });

  test("shows it in another tab of the same User too, from the server's join time", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(100_000);
    await renderAppFor("/fr/leaderboard", { reader: ada, openSocket: sockets.open });

    receive(idle());

    expect(sidebarWait()).not.toBeInTheDocument();

    receive(queueElsewhere(10_000, 22_000));

    expect(await within(sidebar()).findByRole("timer")).toHaveAccessibleName(
      "Dans la Queue depuis 0:12",
    );
    expect(sent()).toEqual([]);

    receive(idle());

    expect(sidebarWait()).not.toBeInTheDocument();
  });

  test("shows it in English too", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "Langue : Français. Passer en English" }));

    expect(
      await within(screen.getByRole("complementary", { name: "Sidebar" })).findByRole("timer"),
    ).toHaveAccessibleName("In the Queue for 0:07");
  });
});

describe("a Match proposal on another page", () => {
  test("opens there, and accepting it leads to /duel", async () => {
    const { user, url } = await renderQueue();

    await user.click(sidebarLink("Ranked"));
    receive(matchProposed);

    const dialog = await screen.findByRole("dialog");

    expect(url()).toBe("/fr/ranked");
    expect(within(dialog).getByText("kzr_")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^Accepter/ }));

    expect(sent()).toContainEqual({ type: "accept-proposal" });

    receive({ type: "proposal-ended", reason: "accepted" });
    receive(duelFound);

    await waitFor(() => expect(url()).toBe("/fr/duel"));
    expect(sent()).not.toContainEqual({ type: "leave-queue" });
  });

  test("declined there, the User is out of the Queue and back to Solo stays on that page", async () => {
    const { user, url } = await renderQueue();

    await user.click(sidebarLink("Ranked"));
    receive(matchProposed);
    await user.click(await screen.findByRole("button", { name: /^Refuser/ }));
    receive({ type: "proposal-ended", reason: "declined", queueLockedUntil: null });
    await user.click(await screen.findByRole("button", { name: "Retour au Solo" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(url()).toBe("/fr/ranked");
    expect(sent()).toEqual([{ type: "join-queue" }, { type: "decline-proposal" }]);
  });
});

describe("the Friends meanwhile", () => {
  test("can be challenged from any page without leaving the Queue", async () => {
    const { user } = await renderQueue();

    await user.click(sidebarLink("Ranked"));
    receive({
      type: "friends-snapshot",
      presences: [{ userId: "grace-id", presence: "online" }],
      requestsReceived: 0,
    });
    receive({ type: "challenges-snapshot", sent: null, received: [], serverTime: 1_000 });

    const online = within(sidebar()).getByRole("region", { name: "En ligne · 1" });

    expect(within(online).getByText("Défie-les sans quitter la Queue.")).toBeInTheDocument();

    await user.click(within(online).getByRole("button", { name: "Défier @grace" }));

    expect(sent()).toEqual([
      { type: "join-queue" },
      { type: "send-challenge", userId: "grace-id" },
    ]);
  });
});
