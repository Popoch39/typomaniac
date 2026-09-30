import { act, screen } from "@testing-library/react";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { DUEL_PATH } from "@/components/duel/duel-path";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { fakeServer, idle } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, renderAppFor } from "@/test/render-app";

// The Duel's page is preloaded as soon as a Duel is likely: its code is ready before the Face-off.

const kzr = { id: "kzr-id", handle: "kzr_", image: null };

const matchProposed: ServerMessage = {
  type: "match-proposed",
  expiresAt: 30_000,
  serverTime: 20_000,
  opponent: { handle: "kzr_", image: null, ornament: null },
  selfOrnament: null,
  selfRank: { tier: "gold", division: 2, tp: 64, shielded: false },
  opponentRank: { placementsLeft: 3 },
  selfAccepted: false,
  opponentAccepted: false,
  dodgeLock: 120_000,
};

const noChallenge: ServerMessage = {
  type: "challenges-snapshot",
  sent: null,
  received: [],
  serverTime: 0,
};

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const receive = (message: ServerMessage) => act(() => sockets.server().receive(message));

// Ada on Jouer, connected, with no Challenge; `duelPreloaded` tells whether the router was asked
// for the Duel's page since.
const renderJouer = async () => {
  const app = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

  receive(idle());
  receive(noChallenge);

  const preload = vi.spyOn(app.router, "preloadRoute");
  const duelPreloaded = () => preload.mock.calls.some(([{ to }]) => to === DUEL_PATH);

  return { ...app, duelPreloaded };
};

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  gsapClock = holdGsapClock();
});

afterEach(() => {
  gsapClock.release();
  vi.restoreAllMocks();
  useConnectionStore.getState().close();
  useDuelStore.setState(useDuelStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("the Duel's page", () => {
  test("is not preloaded while no Duel is likely", async () => {
    const app = await renderJouer();

    expect(app.duelPreloaded()).toBe(false);
  });

  test("is preloaded as a Match proposal arrives", async () => {
    const app = await renderJouer();

    await app.user.click(screen.getByRole("button", { name: "Lancer la recherche" }));
    receive({ type: "queued" });
    receive(matchProposed);

    await act(async () => {});
    expect(app.duelPreloaded()).toBe(true);
  });

  test("is preloaded as a Match proposal arrives in the Queue pill, on another page", async () => {
    const app = await renderJouer();

    await app.user.click(screen.getByRole("button", { name: "Lancer la recherche" }));
    receive({ type: "queued" });
    await app.user.click(screen.getByRole("link", { name: "Classement" }));
    receive(matchProposed);

    await act(async () => {});
    expect(app.url()).toBe("/fr/leaderboard");
    expect(app.duelPreloaded()).toBe(true);
  });

  test("is preloaded as a Challenge is sent", async () => {
    const app = await renderJouer();

    receive({
      type: "challenge-sent",
      challenge: { id: "c1", to: kzr, expiresAt: 30_000 },
      serverTime: 0,
    });

    await act(async () => {});
    expect(app.duelPreloaded()).toBe(true);
  });

  test("is preloaded as a Challenge is received", async () => {
    const app = await renderJouer();

    receive({
      type: "challenge-received",
      challenge: { id: "c2", from: kzr, expiresAt: 30_000 },
      serverTime: 0,
    });

    await act(async () => {});
    expect(app.duelPreloaded()).toBe(true);
  });
});
