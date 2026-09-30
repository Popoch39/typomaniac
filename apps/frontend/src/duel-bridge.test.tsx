import { act, screen, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { useConnectionStore } from "@/stores/connection-store";
import { useDuelBridgeStore } from "@/stores/duel-bridge-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { fakeServer, idle } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, renderAppFor } from "@/test/render-app";

// From « C'est parti ! » to the Face-off, the Duel's bridge holds the screen: the card the Duel
// comes from stays where it was, then the Face-off covers the screen, and only then does the
// Duel's scene and URL show under it. Never a moment without one or the other.

const kzr = { id: "kzr-id", handle: "kzr_", image: null };

const opponent = { handle: "kzr_", image: null, ornament: null };

const placement = { placementsLeft: 3 };

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

// Found at 0 on the tab's clock, the second of « C'est parti ! » before the Countdown: the
// Face-off comes in at 1 s, its panels cover the screen at 1.35 s, the Duel starts at 5.5 s.
const duelFound = (rank: typeof placement | null = placement): ServerMessage => ({
  type: "duel-found",
  duel: {
    id: "duel-1",
    seed: 42,
    language: "en",
    wordListVersion: 1,
    seconds: 30,
    startsAt: 5_500,
  },
  opponent,
  selfOrnament: null,
  serverTime: 0,
  pace: 50,
  opponentPace: 50,
  selfRank: rank,
  opponentRank: rank,
  selfForm: null,
  opponentForm: null,
  selfStake: null,
});

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const receive = (message: ServerMessage) => act(() => sockets.server().receive(message));

// The copy of the card the bridge holds, where the card was.
const bridgeCard = () => document.querySelector("[data-duel-bridge-copy]");

const faceOff = () => document.querySelector('[data-face-off="own"]');

const sidebar = () => screen.getByLabelText("Barre latérale");

type App = Awaited<ReturnType<typeof renderAppFor>>;

// The tab's clock at `at` ms, and the frame that reads it.
const frameAt = async (app: App, at: number) => {
  app.clockAt(at);
  await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
};

// Every tenth of a second from `at` to 2 s, one frame after the other: the card or the Face-off
// shows at each of them, and the Duel's URL only once the panels cover the screen.
const neverEmpty = async (app: App, at = 0): Promise<void> => {
  if (at > 2_000) {
    return;
  }

  await frameAt(app, at);

  expect(bridgeCard() !== null || faceOff() !== null).toBe(true);

  if (app.url().endsWith("/duel")) {
    expect(faceOff()).not.toBeNull();
  }

  await neverEmpty(app, at + 100);
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

// Ada on Jouer, in the Queue, her Match proposal accepted by both.
const renderAccepted = async () => {
  const app = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

  receive(idle());
  await app.user.click(screen.getByRole("button", { name: "Lancer la recherche" }));
  receive({ type: "queued" });
  receive(matchProposed);
  await app.user.click(screen.getByRole("button", { name: /^Accepter le Duel/ }));
  receive({ type: "proposal-ended", reason: "accepted" });

  return app;
};

describe("the Duel's bridge, from a Match proposal on Jouer", () => {
  test("the card says « C'est parti ! » once both accepted", async () => {
    await renderAccepted();

    expect(screen.getByRole("region", { name: "C'est parti !" })).toBeInTheDocument();
  });

  test("its copy holds the card's place as the Duel is found, on Jouer, the sidebar shown", async () => {
    const app = await renderAccepted();

    receive(duelFound());

    expect(bridgeCard()).toHaveTextContent("C'est parti !");
    expect(bridgeCard()).toHaveAttribute("aria-hidden", "true");
    expect(faceOff()).toBeNull();
    expect(app.url()).toBe("/fr");
    expect(sidebar()).not.toHaveAttribute("hidden");
  });

  test("the Face-off follows it, and the Duel's scene and URL show only under its panels", async () => {
    const app = await renderAccepted();

    receive(duelFound());
    await frameAt(app, 1_000);

    expect(faceOff()).not.toBeNull();
    expect(app.url()).toBe("/fr");
    expect(sidebar()).not.toHaveAttribute("hidden");

    await frameAt(app, 1_500);

    expect(app.url()).toBe("/fr/duel");
    expect(sidebar()).toHaveAttribute("hidden");
    expect(await screen.findByRole("button", { name: "Quitter le Duel" })).toBeInTheDocument();
  });

  test("leaves no moment without the card or the Face-off", async () => {
    const app = await renderAccepted();

    receive(duelFound());

    await neverEmpty(app);
  });

  test("no second « C'est parti ! » in the typing area", async () => {
    const app = await renderAccepted();

    receive(duelFound());
    await frameAt(app, 1_500);
    await screen.findByRole("button", { name: "Quitter le Duel" });

    expect(screen.queryByRole("region", { name: "C'est parti !" })).not.toBeInTheDocument();
  });

  test("lets go at the end of the Face-off's exit", async () => {
    const app = await renderAccepted();

    receive(duelFound());
    await frameAt(app, 1_500);
    await frameAt(app, 6_100);

    expect(faceOff()).toBeNull();
    expect(bridgeCard()).toBeNull();
    expect(useDuelBridgeStore.getState().bridged).toBeNull();
  });
});

describe("the Duel's bridge, from an accepted Challenge", () => {
  test("the Challenge's card holds, then the Face-off, on the page the User is on", async () => {
    const app = await renderAppFor("/fr/friends", { reader: ada, openSocket: sockets.open });

    receive(idle());
    receive({ type: "challenges-snapshot", sent: null, received: [], serverTime: 0 });
    receive({
      type: "challenge-received",
      challenge: { id: "c1", from: kzr, expiresAt: 30_000 },
      serverTime: 0,
    });
    receive({ type: "challenge-ended", challengeId: "c1", reason: "accepted" });

    const challenges = screen.getByRole("list", { name: "Challenges" });

    expect(within(challenges).getByText("C'est parti !")).toBeInTheDocument();

    receive(duelFound(null));

    expect(bridgeCard()).toHaveTextContent("C'est parti !");
    expect(app.url()).toBe("/fr/friends");

    await neverEmpty(app);

    expect(app.url()).toBe("/fr/duel");
  });
});

describe("the Duel's bridge, without a card", () => {
  test("says « C'est parti ! » in the middle of the screen, then the Face-off", async () => {
    const app = await renderAppFor("/fr/ranked", { reader: ada, openSocket: sockets.open });

    receive(idle());
    receive(duelFound(null));

    expect(bridgeCard()).toBeNull();
    expect(screen.getByRole("region", { name: "C'est parti !" })).toBeInTheDocument();

    await frameAt(app, 1_000);

    expect(screen.queryByRole("region", { name: "C'est parti !" })).not.toBeInTheDocument();
    expect(faceOff()).not.toBeNull();
  });
});
