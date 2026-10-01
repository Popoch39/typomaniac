import type { Form, ServerMessage } from "api";
import type { Keystroke } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { inFirstRound } from "@/test/duel-rounds";
import { fakeServer, idle, queueElsewhere } from "@/test/fake-socket";

const duel = {
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  startsAt: 3_000,
  roundsToWin: 2,
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

const goldIv = { tier: "gold", division: 4, tp: 50, shielded: false } as const;

// What a win and a loss would do from Gold IV at 50 TP, against an equal.
const goldIvStake = {
  win: { tp: 20, standing: { ...goldIv, tp: 70 } },
  loss: { tp: -20, standing: { ...goldIv, tp: 30 } },
};

const adaForm: Form = { avgWpm: 72.4, outcomes: ["win", "loss", "draw"] };

let sockets = fakeServer();

const server = () => sockets.server();

const enter = () => useDuelStore.getState().enter(() => 0);

const phase = () => useDuelStore.getState().state.phase;

const duelState = () => useDuelStore.getState().state;

const matchProposed: ServerMessage = {
  type: "match-proposed",
  expiresAt: 25_000,
  serverTime: 20_000,
  opponent: { handle: "kaelis", image: null, ornament: "diamond" },
  selfOrnament: "gold",
  selfRank: goldIv,
  opponentRank: { placementsLeft: 3 },
  selfAccepted: false,
  opponentAccepted: false,
  dodgeLock: null,
};

const proposal = () => {
  const { state } = useDuelStore.getState();

  return state.phase === "proposed" ? state.proposal : null;
};

// Shown, in the Queue.
const inQueue = () => {
  server().receive(idle());
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
    server().receive(idle());
    server().receive({ type: "elsewhere", place: "duel" });

    expect(server().sent).toEqual([]);
  });

  test("shown, joins the Queue when the User has no place", () => {
    server().receive(idle());
    enter();

    expect(server().sent).toEqual([{ type: "join-queue" }]);

    server().receive({ type: "queued" });
    expect(phase()).toBe("queued");
  });

  test("waiting in the Queue, knows since when on this tab's clock, how many wait and the Estimated wait", () => {
    server().receive(idle());
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

    server().receive(queueElsewhere());
    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("resumes the User's Duel played nowhere else, as after a reload", () => {
    enter();
    server().receive({ type: "elsewhere", place: "duel" });

    expect(server().sent).toEqual([{ type: "resume-duel" }]);
  });

  test("another tab taking the place leaves it there, until taken back here", () => {
    server().receive(idle());
    enter();
    server().receive({ type: "queued" });
    server().receive(queueElsewhere());

    expect(phase()).toBe("elsewhere");
    expect(server().sent).toEqual([{ type: "join-queue" }]);

    server().receive({ type: "elsewhere", place: "duel" });
    useDuelStore.getState().claim();

    expect(server().sent).toEqual([{ type: "join-queue" }, { type: "resume-duel" }]);
  });

  test("taken by another tab before this one was told it queued: not taken back", () => {
    server().receive(idle());
    enter();
    server().receive(queueElsewhere());

    expect(phase()).toBe("elsewhere");
    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("leaving Duel leaves the Queue, or forfeits a Duel in play", () => {
    server().receive(idle());
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
    server().receive(idle());
    enter();
    server().receive({ type: "queued" });
    server().drop();

    expect(phase()).toBe("connecting");

    vi.advanceTimersByTime(1_000);
    server().receive(idle());

    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("back from a lost connection, resumes the Duel played here", () => {
    server().receive(idle());
    enter();
    server().receive(duelFound);
    server().drop();

    expect(useDuelStore.getState().state).toMatchObject({ duel: { connected: false } });

    vi.advanceTimersByTime(1_000);
    server().receive({ type: "elsewhere", place: "duel" });

    expect(server().sent).toEqual([{ type: "resume-duel" }]);
  });

  test("paired, shows both Ornaments, both ranks and both Forms in the Countdown", () => {
    server().receive(idle());
    enter();
    server().receive({
      ...duelFound,
      opponent: { handle: "ada", image: null, ornament: "gold" },
      selfOrnament: "silver",
      selfRank: null,
      opponentRank: goldIv,
      selfForm: null,
      opponentForm: adaForm,
    });

    expect(useDuelStore.getState().state).toMatchObject({
      phase: "countdown",
      duel: {
        opponent: { ornament: "gold" },
        selfOrnament: "silver",
        selfRank: null,
        opponentRank: goldIv,
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
      ...inFirstRound(duel),
      keystrokes: [],
      received: 0,
      opponentKeystrokes: [],
      opponentConnected: true,
      pace: 40,
      opponentPace: 40,
      selfRank: goldIv,
      opponentRank: null,
      selfForm: adaForm,
      opponentForm: null,
      selfStake: goldIvStake,
    });

    expect(useDuelStore.getState().state).toMatchObject({
      phase: "countdown",
      duel: {
        selfRank: goldIv,
        opponentRank: null,
        selfForm: adaForm,
        opponentForm: null,
        selfStake: goldIvStake,
      },
    });
  });

  describe("a Match proposal", () => {
    test("is shown to answer, its end on this tab's clock, both Ornaments, both ranks and the warning", () => {
      inQueue();
      server().receive({ ...matchProposed, dodgeLock: 60_000 });

      expect(useDuelStore.getState().state).toEqual({
        phase: "proposed",
        proposal: {
          stage: "pending",
          expiresAt: 5000,
          opponent: { handle: "kaelis", image: null, ornament: "diamond" },
          selfOrnament: "gold",
          selfRank: goldIv,
          opponentRank: { placementsLeft: 3 },
          selfAccepted: false,
          opponentAccepted: false,
          queueLock: null,
          dodgeLock: 60_000,
        },
        queue: null,
      });
    });

    test("keeps the wait the Queue told, and so does the way back after the opponent's Dodge", () => {
      inQueue();
      server().receive({
        type: "queue-status",
        joinedAt: 10_000,
        serverTime: 17_000,
        size: 2,
        estimatedWait: null,
      });

      const queue = { joinedAt: -7000, size: 2, estimatedWait: null };

      server().receive(matchProposed);
      expect(useDuelStore.getState().state).toMatchObject({ phase: "proposed", queue });

      server().receive({ type: "proposal-ended", reason: "opponent-declined" });
      server().receive({ type: "queued" });
      expect(useDuelStore.getState().state).toEqual({ phase: "queued", queue });
    });

    test("forgets it once the User dodged: joining again is a new wait", () => {
      inQueue();
      server().receive({
        type: "queue-status",
        joinedAt: 10_000,
        serverTime: 17_000,
        size: 2,
        estimatedWait: null,
      });
      server().receive(matchProposed);
      useDuelStore.getState().declineProposal();
      server().receive({ type: "proposal-ended", reason: "declined", queueLockedUntil: null });
      useDuelStore.getState().joinQueue();
      server().receive({ type: "queued" });

      expect(useDuelStore.getState().state).toEqual({ phase: "queued", queue: null });
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
      server().receive({ type: "proposal-ended", reason: "missed", queueLockedUntil: null });

      expect(proposal()).toMatchObject({ stage: "missed", selfAccepted: false, queueLock: null });
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

      server().receive({ type: "proposal-ended", reason: "declined", queueLockedUntil: null });
      expect(proposal()?.stage).toBe("declined");
      expect(useConnectionStore.getState().place).toEqual({ at: "idle" });
    });

    test("a Dodge that locks the Queue says until when, on this tab's clock, and for how long", () => {
      inQueue();
      // The server's clock runs 20 s ahead of this tab's.
      server().receive(matchProposed);
      useDuelStore.getState().declineProposal();
      server().receive({ type: "proposal-ended", reason: "declined", queueLockedUntil: 80_000 });

      expect(proposal()).toMatchObject({
        stage: "declined",
        queueLock: { until: 60_000, duration: 60_000 },
      });
    });

    test("a Queue lock already over when told, back from being away, is no lock", () => {
      inQueue();
      server().receive(matchProposed);
      server().receive({ type: "proposal-ended", reason: "missed", queueLockedUntil: 20_000 });

      expect(proposal()).toMatchObject({ stage: "missed", queueLock: null });
    });

    test("refused the Queue during a Queue lock, says until when, on this tab's clock", () => {
      server().receive(idle());
      enter();
      server().receive({ type: "queue-locked", until: 50_000, serverTime: 20_000 });

      expect(useDuelStore.getState().state).toEqual({ phase: "locked", until: 30_000 });

      // Out of the Queue: leaving tells the server nothing.
      expect(server().sent).toEqual([{ type: "join-queue" }]);

      // Searching once it is over joins the Queue.
      useDuelStore.getState().joinQueue();
      server().receive({ type: "queued" });
      expect(phase()).toBe("queued");
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
      server().receive(queueElsewhere());
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
      server().receive(queueElsewhere());

      expect(server().sent).toEqual([{ type: "join-queue" }]);
    });

    test("back from a lost connection, it comes back as it stood, its end on this tab's clock", () => {
      inQueue();
      server().receive(matchProposed);
      useDuelStore.getState().acceptProposal();
      server().drop();
      vi.advanceTimersByTime(1_000);
      server().receive(queueElsewhere());
      server().receive({
        ...matchProposed,
        serverTime: 23_000,
        selfAccepted: true,
        opponentAccepted: true,
      });

      expect(proposal()).toEqual({
        stage: "accepted",
        expiresAt: 2000,
        opponent: { handle: "kaelis", image: null, ornament: "diamond" },
        selfOrnament: "gold",
        selfRank: goldIv,
        opponentRank: { placementsLeft: 3 },
        selfAccepted: true,
        opponentAccepted: true,
        queueLock: null,
        dodgeLock: null,
      });
    });

    test("back once its time ran out, it says so", () => {
      inQueue();
      server().receive(matchProposed);
      server().drop();
      vi.advanceTimersByTime(1_000);
      server().receive(idle());

      expect(server().sent).toEqual([{ type: "join-queue" }]);

      server().receive({ ...matchProposed, serverTime: 27_000 });
      server().receive({ type: "proposal-ended", reason: "missed", queueLockedUntil: null });

      expect(proposal()).toMatchObject({ stage: "missed", selfAccepted: false });
      expect(useConnectionStore.getState().place).toEqual({ at: "idle" });
    });

    test("back once its time ran out and its Dodge locked the Queue, the lock shows, then the Match proposal missed", () => {
      inQueue();
      server().receive(matchProposed);
      server().drop();
      vi.advanceTimersByTime(1_000);
      // The server's clock runs 27 s ahead of this tab's.
      server().receive(idle(87_000, 27_000));

      expect(useDuelStore.getState().state).toEqual({ phase: "locked", until: 60_000 });
      expect(server().sent).toEqual([{ type: "join-queue" }]);

      server().receive({ ...matchProposed, serverTime: 27_000 });
      server().receive({ type: "proposal-ended", reason: "missed", queueLockedUntil: 87_000 });

      expect(proposal()).toMatchObject({
        stage: "missed",
        queueLock: { until: 60_000, duration: 60_000 },
      });
    });

    test("a Dodge on another tab that locks the Queue shows the lock here, without asking the Queue", () => {
      // Another tab took the place since this one asked for it.
      server().receive(idle());
      enter();
      server().receive(queueElsewhere());
      server().receive(idle());

      expect(phase()).toBe("elsewhere");

      server().receive(idle(80_000, 20_000));

      expect(useDuelStore.getState().state).toEqual({ phase: "locked", until: 60_000 });
      expect(server().sent).toEqual([{ type: "join-queue" }]);
    });

    test.each(["declined", "missed"] as const)(
      "%s, a lost connection keeps it as it ended, out of the Queue",
      (reason) => {
        inQueue();
        server().receive(matchProposed);
        server().receive({ type: "proposal-ended", reason, queueLockedUntil: null });
        server().drop();
        vi.advanceTimersByTime(1_000);
        server().receive(idle());

        expect(proposal()?.stage).toBe(reason);
        expect(server().sent).toEqual([]);
      },
    );
  });

  test("back from a lost connection with the Duel gone, says it was lost", () => {
    server().receive(idle());
    enter();
    server().receive(duelFound);
    server().drop();
    vi.advanceTimersByTime(1_000);
    server().receive(idle());

    expect(phase()).toBe("disconnected");
    expect(server().sent).toEqual([]);
  });
});

describe("a Bo3", () => {
  // This tab's clock, moved by hand: it agrees with the server's.
  let now = 0;

  const tick = (at: number) => {
    now = at;
    useDuelStore.getState().tick(at);
  };

  const press = (char: string, at: number) => {
    now = at;
    useDuelStore.getState().press({ kind: "char", char }, at);
  };

  const noResult = {
    wpm: 0,
    raw: 0,
    accuracy: 0,
    consistency: 0,
    chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
  };

  const noScore = { score: 0, bestCombo: 0, bursts: 0 };

  // The first Round, won by this User, judged 400 ms after its 30 s: the second starts 7 s later.
  const firstRound = {
    index: 0,
    outcome: "win",
    result: noResult,
    opponentResult: noResult,
    score: { score: 12, bestCombo: 2, bursts: 0 },
    opponentScore: noScore,
  } as const;

  const JUDGED_AT = duel.startsAt + 30_400;

  const SECOND_STARTS_AT = JUDGED_AT + 7000;

  const roundEnded: ServerMessage = {
    type: "round-ended",
    round: firstRound,
    roundsWon: 1,
    opponentRoundsWon: 0,
    next: { index: 1, seed: 77, startsAt: SECOND_STARTS_AT },
    serverTime: JUDGED_AT,
  };

  // The Duel found and played here up to the end of its first Round's time.
  const finishingFirstRound = () => {
    now = 0;
    server().receive(idle());
    useDuelStore.getState().enter(() => now);
    server().receive(duelFound);
    tick(duel.startsAt);
    press("s", duel.startsAt + 1000);
    tick(duel.startsAt + 30_000);
    vi.advanceTimersByTime(100);
  };

  test("a Round ended without deciding the Duel is a Round break, its Round and counts told", () => {
    finishingFirstRound();
    expect(duelState().phase).toBe("finishing");

    now = JUDGED_AT;
    server().receive(roundEnded);

    expect(duelState()).toMatchObject({
      phase: "round-break",
      duel: { roundIndex: 0, rounds: [firstRound], roundsWon: 1, opponentRoundsWon: 0 },
      next: { index: 1, seed: 77, startsAt: SECOND_STARTS_AT },
    });
  });

  test("typing is blocked during the Round break, until the next Round starts at its start", () => {
    finishingFirstRound();
    now = JUDGED_AT;
    server().receive(roundEnded);

    const sentBefore = server().sent.length;

    press("x", SECOND_STARTS_AT - 1000);
    tick(SECOND_STARTS_AT - 1);
    expect(duelState().phase).toBe("round-break");

    tick(SECOND_STARTS_AT);

    expect(duelState()).toMatchObject({
      phase: "running",
      duel: {
        roundIndex: 1,
        config: { seed: 77 },
        startsAt: SECOND_STARTS_AT,
        keystrokes: [],
        opponentKeystrokes: [],
        score: { score: 0 },
        opponentScore: { score: 0 },
        rounds: [firstRound],
      },
    });

    // Its Keystrokes are dated from its own start, and only those go to the server.
    press("h", SECOND_STARTS_AT + 250);
    vi.advanceTimersByTime(100);

    expect(server().sent.slice(sentBefore)).toEqual([
      { type: "keystrokes", keystrokes: [{ kind: "char", char: "h", at: 250 }] },
    ]);
  });

  test("leaving during the Round break forfeits the Duel", () => {
    finishingFirstRound();
    now = JUDGED_AT;
    server().receive(roundEnded);
    useDuelStore.getState().exit();

    expect(server().sent.at(-1)).toEqual({ type: "leave-duel" });
  });

  test("a resync during the Round break leaves the Round played as it was", () => {
    finishingFirstRound();
    now = JUDGED_AT;
    server().receive(roundEnded);
    server().receive({ type: "resync", keystrokes: [], received: 3, opponentKeystrokes: [] });

    expect(duelState()).toMatchObject({
      phase: "round-break",
      duel: { keystrokes: [{ kind: "char", char: "s", at: 1000 }] },
    });
  });

  // The Duel as the server holds it at `serverTime`, in its second Round (or the Round break before
  // it), with the opponent's Keystrokes of that Round.
  const resumedAt = (serverTime: number, opponentKeystrokes: Keystroke[] = []): ServerMessage => ({
    type: "duel-resumed",
    duel,
    opponent: { handle: "ada", image: null, ornament: null },
    selfOrnament: null,
    serverTime,
    rounds: [firstRound],
    roundsWon: 1,
    opponentRoundsWon: 0,
    round: { index: 1, seed: 77, startsAt: SECOND_STARTS_AT },
    keystrokes: [],
    received: 0,
    opponentKeystrokes,
    opponentConnected: true,
    pace: 40,
    opponentPace: 40,
    selfRank: goldIv,
    opponentRank: goldIv,
    selfForm: null,
    opponentForm: null,
    selfStake: goldIvStake,
  });

  test("resumed during a Round break, it is rebuilt there, the next Round on its start", () => {
    now = JUDGED_AT + 2000;
    useDuelStore.getState().enter(() => now);
    server().receive({ type: "elsewhere", place: "duel" });
    server().receive(resumedAt(JUDGED_AT + 2000));

    expect(duelState()).toMatchObject({
      phase: "round-break",
      duel: { roundIndex: 1, rounds: [firstRound], roundsWon: 1, config: { seed: 77 } },
      next: { index: 1, seed: 77, startsAt: SECOND_STARTS_AT },
    });

    tick(SECOND_STARTS_AT);
    expect(duelState()).toMatchObject({ phase: "running", duel: { roundIndex: 1 } });
  });

  test("resumed in the second Round, it is rebuilt there with that Round's Keystrokes", () => {
    now = SECOND_STARTS_AT + 1000;
    useDuelStore.getState().enter(() => now);
    server().receive({ type: "elsewhere", place: "duel" });
    server().receive(resumedAt(SECOND_STARTS_AT + 1000, [{ kind: "char", char: "q", at: 300 }]));
    tick(SECOND_STARTS_AT + 1000);

    expect(duelState()).toMatchObject({
      phase: "running",
      duel: {
        roundIndex: 1,
        rounds: [firstRound],
        startsAt: SECOND_STARTS_AT,
        opponentKeystrokes: [{ kind: "char", char: "q", at: 300 }],
      },
    });
  });

  test("back from a lost connection during the Round break, the same Round break goes on", () => {
    finishingFirstRound();
    now = JUDGED_AT;
    server().receive(roundEnded);
    server().drop();
    vi.advanceTimersByTime(1_000);
    now = JUDGED_AT + 1000;
    server().receive({ type: "elsewhere", place: "duel" });
    server().receive(resumedAt(JUDGED_AT + 1000));

    expect(duelState()).toMatchObject({
      phase: "round-break",
      duel: { connected: true, keystrokes: [{ kind: "char", char: "s", at: 1000 }] },
      next: { startsAt: SECOND_STARTS_AT },
    });
  });
});
