import type { ClientMessage, ServerMessage } from "api";
import {
  applyKeystroke,
  computeResult,
  createRun,
  isFinished,
  type Key,
  type Keystroke,
  replayRun,
  type Result,
  type RunConfig,
  type RunState,
} from "typing-engine";
import { create } from "zustand";

import { api } from "@/api/client";
import type { Clock } from "@/components/run/clock-context";

type DuelFound = Extract<ServerMessage, { type: "duel-found" }>;

export type DuelOpponent = DuelFound["opponent"];

// A Duel as this tab plays it. Both Runs are replayed by the engine: this User's from the
// Keystrokes typed here, the opponent's from those the server relays.
export type DuelPlay = {
  opponent: DuelOpponent;
  config: RunConfig & { mode: "time" };
  // The start on this tab's clock: the server's `startsAt` shifted by the clock offset.
  startsAt: number;
  run: RunState;
  // Every Keystroke typed here, sent or not yet.
  keystrokes: readonly Keystroke[];
  opponentRun: RunState;
  opponentKeystrokes: readonly Keystroke[];
};

export type DuelState =
  | { phase: "connecting" }
  | { phase: "queued" }
  // Paired, typing blocked until the start.
  | { phase: "countdown"; duel: DuelPlay }
  | { phase: "running"; duel: DuelPlay }
  | { phase: "ended"; duel: DuelPlay; result: Result }
  // Another tab of the same User took the place.
  | { phase: "replaced" }
  | { phase: "disconnected" };

type DuelStore = {
  state: DuelState;
  // Opens the Duel socket and joins the Queue. `clock` stamps the Keystrokes and the Countdown.
  connect: (clock: Clock) => void;
  // Closes the socket: the server drops the User from the Queue.
  disconnect: () => void;
  // Nouveau Duel, once the previous one is over: back to the Queue on the same socket.
  joinQueue: () => void;
  press: (key: Key, now: number) => void;
  // Starts the Duel at the end of the Countdown and ends it once the time is up. Every frame.
  tick: (now: number) => void;
};

// The Duel being played or just ended, null outside one: for selectors.
export const duelOf = (state: DuelState) =>
  state.phase === "countdown" || state.phase === "running" || state.phase === "ended"
    ? state.duel
    : null;

type DuelSocket = ReturnType<typeof api.duel.subscribe>;

// The Keystrokes are sent in small batches, at most this often.
const BATCH_MS = 50;

// Outside the store's state: nothing renders from them.
let socket: DuelSocket | null = null;

let clock: Clock = () => performance.now();

// Typed Keystrokes not sent yet, and the timer that will send them.
let outbox: Keystroke[] = [];

let flushTimer: ReturnType<typeof setTimeout> | null = null;

const send = (message: ClientMessage) => socket?.send(message);

const flush = () => {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (outbox.length > 0) {
    send({ type: "keystrokes", keystrokes: outbox });
    outbox = [];
  }
};

const queueKeystroke = (keystroke: Keystroke) => {
  outbox.push(keystroke);
  flushTimer ??= setTimeout(flush, BATCH_MS);
};

// The server's clock runs `serverTime - clock()` ahead of this tab's: its `startsAt` is shifted by
// that much. The offset lags by the message's delay, so the Countdown never ends early.
const startDuel = ({ duel, opponent, serverTime }: DuelFound): DuelState => {
  const config = {
    mode: "time",
    seconds: duel.seconds,
    language: duel.language,
    wordListVersion: duel.wordListVersion,
    seed: duel.seed,
  } as const;

  outbox = [];

  return {
    phase: "countdown",
    duel: {
      opponent,
      config,
      startsAt: duel.startsAt - serverTime + clock(),
      run: createRun(config),
      keystrokes: [],
      opponentRun: createRun(config),
      opponentKeystrokes: [],
    },
  };
};

type Resync = Extract<ServerMessage, { type: "resync" }>;

// Back on the state the server holds, plus the Keystrokes it had not received yet.
const resynced = (duel: DuelPlay, { keystrokes, received, opponentKeystrokes }: Resync) => {
  const replayed = [...keystrokes, ...duel.keystrokes.slice(received)];

  return {
    ...duel,
    run: replayRun(duel.config, replayed),
    keystrokes: replayed,
    opponentRun: replayRun(duel.config, opponentKeystrokes),
    opponentKeystrokes,
  };
};

const withOpponentKeystrokes = (duel: DuelPlay, keystrokes: readonly Keystroke[]) => ({
  ...duel,
  opponentRun: keystrokes.reduce(applyKeystroke, duel.opponentRun),
  opponentKeystrokes: [...duel.opponentKeystrokes, ...keystrokes],
});

// Applies a change to the Duel while it is played; once ended, the Result stays as it is.
const updateDuel = (state: DuelState, update: (duel: DuelPlay) => DuelPlay): DuelState =>
  state.phase === "countdown" || state.phase === "running"
    ? { ...state, duel: update(state.duel) }
    : state;

const stateAfter = (state: DuelState, message: ServerMessage): DuelState => {
  switch (message.type) {
    case "queued":
      return { phase: "queued" };
    case "duel-found":
      return startDuel(message);
    case "opponent-keystrokes":
      return updateDuel(state, (duel) => withOpponentKeystrokes(duel, message.keystrokes));
    case "resync":
      return updateDuel(state, (duel) => resynced(duel, message));
    case "replaced":
      return { phase: "replaced" };
    case "invalid-message":
      return state;
  }
};

const pressed = (state: DuelState, key: Key, now: number): DuelState => {
  if (state.phase !== "running") {
    return state;
  }

  const { duel } = state;
  const keystroke: Keystroke = { ...key, at: now - duel.startsAt };

  // Past the end: the next frame ends the Duel.
  if (isFinished(duel.run, keystroke.at)) {
    return state;
  }

  queueKeystroke(keystroke);

  return {
    phase: "running",
    duel: {
      ...duel,
      run: applyKeystroke(duel.run, keystroke),
      keystrokes: [...duel.keystrokes, keystroke],
    },
  };
};

const ticked = (state: DuelState, now: number): DuelState => {
  if (state.phase === "countdown" && now >= state.duel.startsAt) {
    return { phase: "running", duel: state.duel };
  }

  if (state.phase !== "running") {
    return state;
  }

  const at = now - state.duel.startsAt;

  if (!isFinished(state.duel.run, at)) {
    return state;
  }

  flush();

  return {
    phase: "ended",
    duel: state.duel,
    result: computeResult(state.duel.config, state.duel.keystrokes, at),
  };
};

// The Duel connection, one per tab. Only the current socket's events count: a closed one
// (Annuler, StrictMode's double mount) may still deliver its last events.
export const useDuelStore = create<DuelStore>()((set) => ({
  state: { phase: "connecting" },
  connect: (tabClock) => {
    socket?.close();

    const current = api.duel.subscribe();

    socket = current;
    clock = tabClock;
    set({ state: { phase: "connecting" } });

    current.on("open", () => send({ type: "join-queue" }));
    current.subscribe(({ data }) => {
      if (socket === current) {
        set((store) => ({ state: stateAfter(store.state, data) }));
      }
    });
    current.on("close", () => {
      if (socket === current) {
        socket = null;
        set((store) =>
          store.state.phase === "replaced" ? store : { state: { phase: "disconnected" } },
        );
      }
    });
  },
  disconnect: () => {
    const current = socket;

    socket = null;
    outbox = [];
    current?.close();
  },
  joinQueue: () => send({ type: "join-queue" }),
  press: (key, now) => set((store) => ({ state: pressed(store.state, key, now) })),
  tick: (now) =>
    set((store) => {
      const state = ticked(store.state, now);

      return state === store.state ? store : { state };
    }),
}));
