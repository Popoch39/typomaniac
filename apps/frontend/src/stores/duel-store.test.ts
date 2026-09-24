import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { fakeServer } from "@/test/fake-socket";

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
  opponent: { handle: "ada", image: null },
  serverTime: 0,
  pace: 40,
  opponentPace: 40,
};

let sockets = fakeServer();

const server = () => sockets.server();

const enter = () => useDuelStore.getState().enter(() => 0);

const phase = () => useDuelStore.getState().state.phase;

beforeEach(() => {
  vi.useFakeTimers();
  sockets = fakeServer();
  useConnectionStore.getState().open(sockets.open);
});

afterEach(() => {
  useDuelStore.getState().exit();
  useConnectionStore.getState().close();
  vi.useRealTimers();
});

describe("the Duel on the app's connection", () => {
  test("takes nothing while Duel is not shown", () => {
    server().receive({ type: "idle" });
    server().receive({ type: "elsewhere", place: "duel" });

    expect(server().sent).toEqual([]);
  });

  test("shown, joins the Queue when the User has no place", () => {
    server().receive({ type: "idle" });
    enter();

    expect(server().sent).toEqual([{ type: "join-queue" }]);

    server().receive({ type: "queued" });
    expect(phase()).toBe("queued");
  });

  test("shown before the place is known, takes it once told", () => {
    enter();
    expect(server().sent).toEqual([]);

    server().receive({ type: "elsewhere", place: "queue" });
    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("resumes the User's Duel played nowhere else, as after a reload", () => {
    enter();
    server().receive({ type: "elsewhere", place: "duel" });

    expect(server().sent).toEqual([{ type: "resume-duel" }]);
  });

  test("another tab taking the place leaves it there, until taken back here", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive({ type: "queued" });
    server().receive({ type: "elsewhere", place: "queue" });

    expect(phase()).toBe("elsewhere");
    expect(server().sent).toEqual([{ type: "join-queue" }]);

    server().receive({ type: "elsewhere", place: "duel" });
    useDuelStore.getState().claim();

    expect(server().sent).toEqual([{ type: "join-queue" }, { type: "resume-duel" }]);
  });

  test("taken by another tab before this one was told it queued: not taken back", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive({ type: "elsewhere", place: "queue" });

    expect(phase()).toBe("elsewhere");
    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("leaving Duel leaves the Queue, or forfeits a Duel in play", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive({ type: "queued" });
    useDuelStore.getState().exit();

    expect(server().sent).toEqual([{ type: "join-queue" }, { type: "leave-queue" }]);

    enter();
    server().receive(duelFound);
    useDuelStore.getState().exit();

    expect(server().sent.at(-1)).toEqual({ type: "leave-duel" });
  });

  test("back from a lost connection, joins the Queue again", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive({ type: "queued" });
    server().drop();

    expect(phase()).toBe("connecting");

    vi.advanceTimersByTime(1_000);
    server().receive({ type: "idle" });

    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("back from a lost connection, resumes the Duel played here", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive(duelFound);
    server().drop();

    expect(useDuelStore.getState().state).toMatchObject({ duel: { connected: false } });

    vi.advanceTimersByTime(1_000);
    server().receive({ type: "elsewhere", place: "duel" });

    expect(server().sent).toEqual([{ type: "resume-duel" }]);
  });

  test("back from a lost connection with the Duel gone, says it was lost", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive(duelFound);
    server().drop();
    vi.advanceTimersByTime(1_000);
    server().receive({ type: "idle" });

    expect(phase()).toBe("disconnected");
    expect(server().sent).toEqual([]);
  });
});
