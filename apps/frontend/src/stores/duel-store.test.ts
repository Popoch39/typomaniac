import type { Form, ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { fakeServer } from "@/test/fake-socket";

const duel = {
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  startsAt: 3_000,
} as const;

const duelFound: ServerMessage = {
  type: "duel-found",
  duel,
  opponent: { handle: "ada", image: null, ornament: null },
  selfOrnament: null,
  serverTime: 0,
  pace: 40,
  opponentPace: 40,
  selfRank: { placementsLeft: 5 },
  opponentRank: { placementsLeft: 5 },
  selfForm: null,
  opponentForm: null,
  selfStake: null,
};

const orIv = { tier: "or", division: 4, tp: 50, shielded: false } as const;

// What a win and a loss would do from Or IV at 50 TP, against an equal.
const orIvStake = {
  win: { tp: 20, standing: { ...orIv, tp: 70 } },
  loss: { tp: -20, standing: { ...orIv, tp: 30 } },
};

const adaForm: Form = { avgWpm: 72.4, outcomes: ["win", "loss", "draw"] };

let sockets = fakeServer();

const server = () => sockets.server();

const enter = () => useDuelStore.getState().enter(() => 0);

const phase = () => useDuelStore.getState().state.phase;

const matchProposed: ServerMessage = {
  type: "match-proposed",
  expiresAt: 25_000,
  serverTime: 20_000,
  opponent: { handle: "kaelis", image: null, ornament: "diamant" },
  selfOrnament: "or",
  selfRank: orIv,
  opponentRank: { placementsLeft: 3 },
  selfAccepted: false,
  opponentAccepted: false,
};

const proposal = () => {
  const { state } = useDuelStore.getState();

  return state.phase === "proposed" ? state.proposal : null;
};

// Shown, in the Queue.
const inQueue = () => {
  server().receive({ type: "idle" });
  enter();
  server().receive({ type: "queued" });
};

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

  test("waiting in the Queue, knows since when on this tab's clock, how many wait and the Estimated wait", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive({ type: "queued" });
    expect(useDuelStore.getState().state).toEqual({ phase: "queued", queue: null });

    server().receive({
      type: "queue-status",
      joinedAt: 10_000,
      serverTime: 17_000,
      size: 3,
      estimatedWait: 12_000,
    });
    expect(useDuelStore.getState().state).toEqual({
      phase: "queued",
      queue: { joinedAt: -7000, size: 3, estimatedWait: 12_000 },
    });

    server().receive({ type: "queued" });
    expect(useDuelStore.getState().state).toMatchObject({ queue: { size: 3 } });
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

  test("paired, shows both Ornaments, both ranks and both Forms in the Countdown", () => {
    server().receive({ type: "idle" });
    enter();
    server().receive({
      ...duelFound,
      opponent: { handle: "ada", image: null, ornament: "or" },
      selfOrnament: "argent",
      selfRank: null,
      opponentRank: orIv,
      selfForm: null,
      opponentForm: adaForm,
    });

    expect(useDuelStore.getState().state).toMatchObject({
      phase: "countdown",
      duel: {
        opponent: { ornament: "or" },
        selfOrnament: "argent",
        selfRank: null,
        opponentRank: orIv,
        selfForm: null,
        opponentForm: adaForm,
      },
    });
  });

  test("resumed after a reload, shows both ranks, both Forms and the Stake in the Countdown", () => {
    enter();
    server().receive({ type: "elsewhere", place: "duel" });
    server().receive({
      type: "duel-resumed",
      duel,
      opponent: { handle: "ada", image: null, ornament: null },
      selfOrnament: null,
      serverTime: 1_000,
      keystrokes: [],
      received: 0,
      opponentKeystrokes: [],
      opponentConnected: true,
      pace: 40,
      opponentPace: 40,
      selfRank: orIv,
      opponentRank: null,
      selfForm: adaForm,
      opponentForm: null,
      selfStake: orIvStake,
    });

    expect(useDuelStore.getState().state).toMatchObject({
      phase: "countdown",
      duel: {
        selfRank: orIv,
        opponentRank: null,
        selfForm: adaForm,
        opponentForm: null,
        selfStake: orIvStake,
      },
    });
  });

  describe("a Match proposal", () => {
    test("is shown to answer, its end on this tab's clock, both Ornaments and both ranks", () => {
      inQueue();
      server().receive(matchProposed);

      expect(useDuelStore.getState().state).toEqual({
        phase: "proposed",
        proposal: {
          stage: "pending",
          expiresAt: 5000,
          opponent: { handle: "kaelis", image: null, ornament: "diamant" },
          selfOrnament: "or",
          selfRank: orIv,
          opponentRank: { placementsLeft: 3 },
          selfAccepted: false,
          opponentAccepted: false,
        },
      });
    });

    test("accepting tells the server once, then waits for the opponent", () => {
      inQueue();
      server().receive(matchProposed);
      useDuelStore.getState().acceptProposal();
      useDuelStore.getState().acceptProposal();

      expect(server().sent).toEqual([{ type: "join-queue" }, { type: "accept-proposal" }]);
      expect(proposal()?.stage).toBe("accepted");

      server().receive({ type: "opponent-accepted" });
      expect(proposal()).toMatchObject({ stage: "accepted", opponentAccepted: true });
    });

    test("the opponent may accept first", () => {
      inQueue();
      server().receive(matchProposed);
      server().receive({ type: "opponent-accepted" });

      expect(proposal()).toMatchObject({ stage: "pending", opponentAccepted: true });
    });

    test("accepted by both, it is ready, then the Duel found starts the Countdown", () => {
      inQueue();
      server().receive(matchProposed);
      useDuelStore.getState().acceptProposal();
      server().receive({ type: "proposal-ended", reason: "accepted" });

      expect(proposal()).toMatchObject({ stage: "ready", opponentAccepted: true });
      expect(useConnectionStore.getState().place).toEqual({ at: "queue", here: true });

      server().receive(duelFound);
      expect(phase()).toBe("countdown");
      expect(useConnectionStore.getState().place).toEqual({ at: "duel", here: true });
    });

    test("out of time, it says so, and searching again joins the Queue", () => {
      inQueue();
      server().receive(matchProposed);
      server().receive({ type: "proposal-ended", reason: "missed" });

      expect(proposal()).toMatchObject({ stage: "missed", selfAccepted: false });
      expect(useConnectionStore.getState().place).toEqual({ at: "idle" });

      useDuelStore.getState().joinQueue();
      server().receive({ type: "queued" });
      expect(phase()).toBe("queued");
    });

    test("declining tells the server once, and says the User left the Queue", () => {
      inQueue();
      server().receive(matchProposed);
      useDuelStore.getState().declineProposal();
      useDuelStore.getState().declineProposal();

      expect(server().sent).toEqual([{ type: "join-queue" }, { type: "decline-proposal" }]);
      expect(proposal()?.stage).toBe("declined");

      server().receive({ type: "proposal-ended", reason: "declined" });
      expect(proposal()?.stage).toBe("declined");
      expect(useConnectionStore.getState().place).toEqual({ at: "idle" });
    });

    test("declining is only for a Match proposal still to answer", () => {
      inQueue();
      server().receive(matchProposed);
      useDuelStore.getState().acceptProposal();
      useDuelStore.getState().declineProposal();

      expect(server().sent).toEqual([{ type: "join-queue" }, { type: "accept-proposal" }]);
    });

    test.each(["opponent-declined", "opponent-missed"] as const)(
      "%s, the User keeps their acceptance and is back in the Queue once told",
      (reason) => {
        inQueue();
        server().receive(matchProposed);
        useDuelStore.getState().acceptProposal();
        server().receive({ type: "proposal-ended", reason });

        expect(proposal()).toMatchObject({ stage: reason, selfAccepted: true });
        expect(useConnectionStore.getState().place).toEqual({ at: "queue", here: true });

        server().receive({ type: "queued" });
        expect(useDuelStore.getState().state).toEqual({ phase: "queued", queue: null });
      },
    );

    test("comes back as it stood, joining the Queue again from another tab", () => {
      enter();
      server().receive({ type: "elsewhere", place: "queue" });
      server().receive({ ...matchProposed, selfAccepted: true, opponentAccepted: true });

      expect(proposal()).toMatchObject({ stage: "accepted", opponentAccepted: true });
    });

    test("leaving Duel leaves the Queue", () => {
      inQueue();
      server().receive(matchProposed);
      useDuelStore.getState().exit();

      expect(server().sent.at(-1)).toEqual({ type: "leave-queue" });
    });

    test("back from a lost connection, joins the Queue again to get it back", () => {
      inQueue();
      server().receive(matchProposed);
      server().drop();

      expect(phase()).toBe("connecting");

      vi.advanceTimersByTime(1_000);
      server().receive({ type: "elsewhere", place: "queue" });

      expect(server().sent).toEqual([{ type: "join-queue" }]);
    });

    test("back from a lost connection, it comes back as it stood, its end on this tab's clock", () => {
      inQueue();
      server().receive(matchProposed);
      useDuelStore.getState().acceptProposal();
      server().drop();
      vi.advanceTimersByTime(1_000);
      server().receive({ type: "elsewhere", place: "queue" });
      server().receive({
        ...matchProposed,
        serverTime: 23_000,
        selfAccepted: true,
        opponentAccepted: true,
      });

      expect(proposal()).toEqual({
        stage: "accepted",
        expiresAt: 2000,
        opponent: { handle: "kaelis", image: null, ornament: "diamant" },
        selfOrnament: "or",
        selfRank: orIv,
        opponentRank: { placementsLeft: 3 },
        selfAccepted: true,
        opponentAccepted: true,
      });
    });

    test("back once its time ran out, it says so", () => {
      inQueue();
      server().receive(matchProposed);
      server().drop();
      vi.advanceTimersByTime(1_000);
      server().receive({ type: "idle" });

      expect(server().sent).toEqual([{ type: "join-queue" }]);

      server().receive({ ...matchProposed, serverTime: 27_000 });
      server().receive({ type: "proposal-ended", reason: "missed" });

      expect(proposal()).toMatchObject({ stage: "missed", selfAccepted: false });
      expect(useConnectionStore.getState().place).toEqual({ at: "idle" });
    });

    test.each(["declined", "missed"] as const)(
      "%s, a lost connection keeps it as it ended, out of the Queue",
      (reason) => {
        inQueue();
        server().receive(matchProposed);
        server().receive({ type: "proposal-ended", reason });
        server().drop();
        vi.advanceTimersByTime(1_000);
        server().receive({ type: "idle" });

        expect(proposal()?.stage).toBe(reason);
        expect(server().sent).toEqual([]);
      },
    );
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
