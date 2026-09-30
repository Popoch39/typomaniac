import { act, screen, waitFor, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { Me } from "@/api/me";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { useRunStore } from "@/stores/run-store";
import { fakeServer, idle, queueElsewhere } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, renderAppFor } from "@/test/render-app";

const placement = { placementsLeft: 5 };

const duel = {
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  // The Countdown's first moment on a clock at 0: the Face-off comes in.
  startsAt: 4_500,
} as const;

const opponent = { handle: "kzr_", image: null, ornament: null };

const pairing = {
  opponent,
  selfOrnament: null,
  serverTime: 0,
  pace: 50,
  opponentPace: 50,
  selfForm: null,
  opponentForm: null,
  selfStake: null,
} as const;

// Paired by the Queue with @kzr_ (ranked), or by a Challenge (no ranks).
const duelFound = (selfRank: typeof placement | null = placement): ServerMessage => ({
  type: "duel-found",
  duel,
  ...pairing,
  selfRank,
  opponentRank: selfRank,
});

// The Duel as the server holds it, for the connection that resumes it.
const duelResumed: ServerMessage = {
  type: "duel-resumed",
  duel,
  ...pairing,
  selfRank: placement,
  opponentRank: placement,
  keystrokes: [],
  received: 0,
  opponentKeystrokes: [],
  opponentConnected: true,
};

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

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

const duelEnded: ServerMessage = {
  type: "duel-ended",
  duelId: null,
  ranked: null,
  records: null,
  outcome: "draw",
  forfeit: true,
  result: noResult,
  opponentResult: noResult,
  score: noScore,
  opponentScore: noScore,
  opponent: { handle: "kzr_", image: null },
};

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the stores outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

const sent = () => server().sentOfPlace();

// The whole app at `path` for Ada (or a Visitor), on the fake server.
const renderApp = (path: string, reader: Me | null = ada) =>
  renderAppFor(path, { reader, openSocket: sockets.open });

// Jouer's cards, back from the Duel: out of the Queue.
const playCards = () => screen.findByRole("heading", { level: 1, name: "Choisis ton mode" });

// The play page, the search launched: in the Queue.
const renderQueue = async () => {
  const app = await renderApp("/fr");

  receive(idle());
  await app.user.click(screen.getByRole("button", { name: "Lancer la recherche" }));
  receive({ type: "queued" });

  return app;
};

// Ada's Duel against @kzr_, on its own URL: found in the Queue once both accepted.
const renderDuel = async () => {
  const app = await renderQueue();

  receive(matchProposed);
  await app.user.click(await screen.findByRole("button", { name: /^Accepter/ }));
  receive({ type: "proposal-ended", reason: "accepted" });
  receive(duelFound());
  await screen.findByRole("button", { name: "Quitter le Duel" });

  return app;
};

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  gsapClock = holdGsapClock();
});

afterEach(() => {
  gsapClock.release();
  useConnectionStore.getState().close();
  useDuelStore.setState(useDuelStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("the Duel has its own URL", () => {
  test("a Match proposal accepted by both leads to /duel, where the Countdown starts", async () => {
    const { url } = await renderDuel();

    expect(url()).toBe("/fr/duel");
    expect(await screen.findByText("Duel contre @kzr_")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(sent()).not.toContainEqual({ type: "leave-queue" });
    expect(sent()).not.toContainEqual({ type: "leave-duel" });
  });

  test.each(["/fr/ranked", "/fr/friends", "/fr/profile"])(
    "an accepted Challenge leads there from any page, the Solo Run in progress dropped: %s",
    async (page) => {
      const { url } = await renderApp(page);

      receive(idle());
      act(() => useRunStore.setState({ startedAt: 1_000 }));
      receive(duelFound(null));

      await waitFor(() => expect(url()).toBe("/fr/duel"));
      expect(sent()).toEqual([{ type: "resume-duel" }]);
      expect(useRunStore.getState().startedAt).toBeNull();

      receive(duelResumed);

      expect(await screen.findByRole("button", { name: "Quitter le Duel" })).toBeInTheDocument();
      expect(screen.getByText("Duel contre @kzr_")).toBeInTheDocument();
    },
  );

  test("a reload of /duel in the middle of a Duel resumes it, by its URL alone", async () => {
    const { url } = await renderApp("/fr/duel");

    receive({ type: "elsewhere", place: "duel" });

    expect(sent()).toEqual([{ type: "resume-duel" }]);

    receive(duelResumed);

    expect(await screen.findByRole("button", { name: "Quitter le Duel" })).toBeInTheDocument();
    expect(url()).toBe("/fr/duel");
    expect(sessionStorage.length).toBe(0);
  });

  test("left for another page while played, it is forfeited", async () => {
    const { url, history } = await renderDuel();

    act(() => history.push("/fr/ranked"));

    await waitFor(() => expect(sent()).toContainEqual({ type: "leave-duel" }));
    expect(url()).toBe("/fr/ranked");
  });

  test("back on the play page while played, too, which is in Solo again: out of the Queue", async () => {
    const { url, history } = await renderDuel();

    act(() => history.back());

    await waitFor(() => expect(sent()).toContainEqual({ type: "leave-duel" }));
    expect(url()).toBe("/fr");
    expect(await playCards()).toBeInTheDocument();
    expect(sent().filter((message) => message.type === "join-queue")).toHaveLength(1);
  });
});

describe("/duel without a Duel", () => {
  test("goes back to the play page, without joining the Queue", async () => {
    const { url } = await renderApp("/fr/duel");

    receive(idle());

    expect(await playCards()).toBeInTheDocument();
    expect(url()).toBe("/fr");
    expect(sent()).toEqual([]);
  });

  test("a Visitor, who plays no Duel, is sent there at once", async () => {
    const { url } = await renderApp("/fr/duel", null);

    expect(await playCards()).toBeInTheDocument();
    expect(url()).toBe("/fr");
    expect(sockets.sockets).toHaveLength(0);
  });

  test("so does the Queue, held by another tab", async () => {
    const { url } = await renderApp("/fr/duel");

    receive(queueElsewhere());

    expect(await playCards()).toBeInTheDocument();
    expect(url()).toBe("/fr");
    expect(sent()).toEqual([]);
  });
});

describe("the end of the Duel", () => {
  test("Retour au Solo leads back to the play page, in Solo", async () => {
    const { url, user } = await renderDuel();

    receive(duelEnded);
    await user.click(await screen.findByRole("button", { name: "Retour au Solo" }));

    expect(url()).toBe("/fr");
    expect(await playCards()).toBeInTheDocument();
    expect(sent()).not.toContainEqual({ type: "leave-duel" });
  });

  test("Jouer, in the sidebar, leads back to the play page in Solo, never into the Queue", async () => {
    const { url, user } = await renderDuel();

    receive(duelEnded);
    await screen.findByRole("button", { name: "Nouveau Duel" });

    const sidebar = screen.getByRole("complementary", { name: "Barre latérale" });

    await user.click(within(sidebar).getByRole("link", { name: "Jouer" }));

    expect(url()).toBe("/fr");
    expect(await playCards()).toBeInTheDocument();
    expect(sent().filter((message) => message.type === "join-queue")).toHaveLength(1);
  });

  test("Nouveau Duel leads back to the play page, in the Queue again", async () => {
    const { url, user } = await renderDuel();

    receive(duelEnded);
    await user.click(await screen.findByRole("button", { name: "Nouveau Duel" }));

    expect(url()).toBe("/fr");
    expect(
      await screen.findByRole("heading", { name: "On te trouve un adversaire…" }),
    ).toBeInTheDocument();
    expect(sent().filter((message) => message.type === "join-queue")).toHaveLength(2);
  });
});
