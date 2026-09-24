import type { ClientMessage, ServerMessage } from "api";
import {
  applyKeystroke,
  computeScore,
  type Cue,
  cuesOf,
  isFinished,
  type Key,
  type Keystroke,
  replayRun,
  type RunConfig,
  type RunState,
  type ScoreState,
} from "typing-engine";
import { create } from "zustand";

import { api } from "@/api/client";
import type { Clock } from "@/components/run/clock-context";
import { emitCues } from "@/lib/cue-bus";
import { markDuelInProgress } from "@/lib/duel-in-progress";

type DuelFound = Extract<ServerMessage, { type: "duel-found" }>;

type DuelResumed = Extract<ServerMessage, { type: "duel-resumed" }>;

export type DuelOpponent = DuelFound["opponent"];

type DuelEnded = Extract<ServerMessage, { type: "duel-ended" }>;

// How the Duel ended for this User: their outcome, whether it was a Forfeit, their Result and
// Score and the opponent's, computed by the server from the Keystrokes it accepted.
export type DuelEnding = Omit<DuelEnded, "type">;

// A Duel as this tab plays it. Both Runs and both Scores are replayed by the engine: this User's
// from the Keystrokes typed here, the opponent's from those the server relays.
export type DuelPlay = {
  id: string;
  opponent: DuelOpponent;
  config: RunConfig & { mode: "time" };
  // The start on this tab's clock: the server's `startsAt` shifted by the clock offset.
  startsAt: number;
  // Each player's Pace, frozen by the server at the pairing: their Bursts are judged against it.
  pace: number;
  opponentPace: number;
  run: RunState;
  // Every Keystroke typed here, sent or not yet.
  keystrokes: readonly Keystroke[];
  score: ScoreState;
  opponentRun: RunState;
  opponentKeystrokes: readonly Keystroke[];
  opponentScore: ScoreState;
  // False while this tab's connection is lost and being opened again.
  connected: boolean;
  // False while the opponent's connection is lost: they have a few seconds to come back.
  opponentConnected: boolean;
};

export type DuelState =
  | { phase: "connecting" }
  | { phase: "queued" }
  // Refused the Queue: the User has no Handle yet.
  | { phase: "handle-required" }
  // Paired, typing blocked until the start.
  | { phase: "countdown"; duel: DuelPlay }
  | { phase: "running"; duel: DuelPlay }
  // The time is up here: typing blocked until the server ends the Duel, once the last
  // Keystrokes reached it.
  | { phase: "finishing"; duel: DuelPlay }
  // The server's verdict, the same on both screens.
  | { phase: "ended"; ending: DuelEnding }
  // Another tab of the same User took the place.
  | { phase: "replaced" }
  | { phase: "disconnected" };

type DuelStore = {
  state: DuelState;
  // What the User's last Keystroke caused, never the opponent's (ADR 0006).
  cues: readonly Cue[];
  // Opens the Duel socket: the server resumes the User's Duel, or they join the Queue. `clock`
  // stamps the Keystrokes and the Countdown; `openSocket` opens it, and every reconnection's.
  connect: (clock: Clock, openSocket?: OpenDuelSocket) => void;
  // Closes the socket: the server drops the User from the Queue. Leaving a Duel in play this way
  // is a Forfeit.
  disconnect: () => void;
  // Nouveau Duel, once the previous one is over: back to the Queue on the same socket.
  joinQueue: () => void;
  // Quitter le Duel: a Forfeit, the server ends the Duel.
  leave: () => void;
  press: (key: Key, now: number) => void;
  // Starts the Duel at the end of the Countdown and ends it once the time is up. Every frame.
  tick: (now: number) => void;
};

// The Duel being played, null outside one: for selectors.
export const duelOf = (state: DuelState) =>
  state.phase === "countdown" || state.phase === "running" || state.phase === "finishing"
    ? state.duel
    : null;

// What the store uses of the Duel socket: the server's messages, the connection's loss, sending
// and closing. Eden's socket in the app, a fake one in the tests.
export type DuelSocket = {
  subscribe: (listener: (event: { data: ServerMessage }) => void) => void;
  on: (event: "close", listener: () => void) => void;
  send: (message: ClientMessage) => void;
  close: () => void;
};

type OpenDuelSocket = () => DuelSocket;

const openApiSocket: OpenDuelSocket = () => api.duel.subscribe();

// The Keystrokes are sent in small batches, at most this often.
const BATCH_MS = 50;

// A lost connection during a Duel is opened again this often, this many times: past the server's
// 10 s to come back, the Duel is over anyway.
const RECONNECT_MS = 1000;

const MAX_RECONNECTS = 15;

// Outside the store's state: nothing renders from them.
let socket: DuelSocket | null = null;

let clock: Clock = () => performance.now();

let openSocket = openApiSocket;

// Typed Keystrokes not sent yet, and the timer that will send them.
let outbox: Keystroke[] = [];

let flushTimer: ReturnType<typeof setTimeout> | null = null;

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

let reconnects = 0;

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

// Every Keystroke typed here during the Duel, in the order sent, never pruned: a resync or a resume
// sends how many the server received, counted from `base` (what it had received before this page,
// after a reload). A rejected Keystroke still counts as received.
type SentLog = { base: number; keystrokes: Keystroke[] };

let sent: SentLog = { base: 0, keystrokes: [] };

const notReceived = (received: number) => sent.keystrokes.slice(Math.max(0, received - sent.base));

const queueKeystroke = (keystroke: Keystroke) => {
  sent.keystrokes.push(keystroke);
  outbox.push(keystroke);
  flushTimer ??= setTimeout(flush, BATCH_MS);
};

const stopReconnecting = () => {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  reconnects = 0;
};

const configOf = ({ duel }: DuelFound | DuelResumed) =>
  ({
    mode: "time",
    seconds: duel.seconds,
    language: duel.language,
    wordListVersion: duel.wordListVersion,
    seed: duel.seed,
  }) as const;

// The Score of a player so far, as the server computes it from the same Keystrokes and Pace. Up to
// the last Keystroke, the word in progress pays nothing yet.
const scoreOf = (config: RunConfig, keystrokes: readonly Keystroke[], pace: number) =>
  computeScore(config, keystrokes, pace, keystrokes.at(-1)?.at ?? 0);

// The server's clock runs `serverTime - clock()` ahead of this tab's: its `startsAt` is shifted by
// that much. The offset lags by the message's delay, so the Countdown never ends early.
const localStart = ({ duel, serverTime }: DuelFound | DuelResumed) =>
  duel.startsAt - serverTime + clock();

// The Duel from the server's state: Countdown first, the next frame starts it if already due.
const playing = (
  message: DuelFound | DuelResumed,
  played: Pick<DuelPlay, "keystrokes" | "opponentKeystrokes" | "opponentConnected"> & {
    received: number;
  },
): DuelState => {
  const config = configOf(message);

  outbox = [];
  sent = { base: played.received, keystrokes: [] };

  return {
    phase: "countdown",
    duel: {
      id: message.duel.id,
      opponent: message.opponent,
      config,
      startsAt: localStart(message),
      pace: message.pace,
      opponentPace: message.opponentPace,
      run: replayRun(config, played.keystrokes),
      keystrokes: played.keystrokes,
      score: scoreOf(config, played.keystrokes, message.pace),
      opponentRun: replayRun(config, played.opponentKeystrokes),
      opponentKeystrokes: played.opponentKeystrokes,
      opponentScore: scoreOf(config, played.opponentKeystrokes, message.opponentPace),
      connected: true,
      opponentConnected: played.opponentConnected,
    },
  };
};

const startDuel = (message: DuelFound) =>
  playing(message, {
    keystrokes: [],
    received: 0,
    opponentKeystrokes: [],
    opponentConnected: true,
  });

type Resync = Extract<ServerMessage, { type: "resync" }>;

// Back on the state the server holds, plus the Keystrokes it had not received yet.
const resynced = (
  duel: DuelPlay,
  { keystrokes, received, opponentKeystrokes }: Omit<Resync, "type">,
) => {
  const replayed = [...keystrokes, ...notReceived(received)];

  return {
    ...duel,
    run: replayRun(duel.config, replayed),
    keystrokes: replayed,
    score: scoreOf(duel.config, replayed, duel.pace),
    opponentRun: replayRun(duel.config, opponentKeystrokes),
    opponentKeystrokes,
    opponentScore: scoreOf(duel.config, opponentKeystrokes, duel.opponentPace),
  };
};

// Back in the Duel on a new socket. The same Duel as this tab's (a lost connection) keeps its
// start and resends what the server did not receive; otherwise (a reload, another tab) the Duel
// is rebuilt from the server's state, the Countdown's end or the time left run as before.
const resumed = (state: DuelState, message: DuelResumed): DuelState => {
  const local = duelOf(state);

  if (local !== null && local.id === message.duel.id) {
    // Already in `sent`: only sent again.
    outbox = notReceived(message.received);
    flush();

    return updateDuel(state, (duel) => ({
      ...resynced(duel, message),
      connected: true,
      opponentConnected: message.opponentConnected,
    }));
  }

  return playing(message, message);
};

const withOpponentKeystrokes = (duel: DuelPlay, keystrokes: readonly Keystroke[]) => {
  const opponentKeystrokes = [...duel.opponentKeystrokes, ...keystrokes];

  return {
    ...duel,
    opponentRun: keystrokes.reduce(applyKeystroke, duel.opponentRun),
    opponentKeystrokes,
    opponentScore: scoreOf(duel.config, opponentKeystrokes, duel.opponentPace),
  };
};

// Applies a change to the Duel while it is played, up to the server's end.
const updateDuel = (state: DuelState, update: (duel: DuelPlay) => DuelPlay): DuelState =>
  state.phase === "countdown" || state.phase === "running" || state.phase === "finishing"
    ? { ...state, duel: update(state.duel) }
    : state;

// The server ends the Duel, possibly before this tab's time is up: nothing typed here counts
// anymore. Also told on connection when the Duel ended while this User was away.
const ended = ({
  outcome,
  forfeit,
  result,
  opponentResult,
  score,
  opponentScore,
  opponent,
}: DuelEnded): DuelState => {
  outbox = [];

  return {
    phase: "ended",
    ending: { outcome, forfeit, result, opponentResult, score, opponentScore, opponent },
  };
};

const stateAfter = (state: DuelState, message: ServerMessage): DuelState => {
  switch (message.type) {
    // No place on the server (nothing to resume): into the Queue.
    case "idle":
      send({ type: "join-queue" });

      return state;
    case "queued":
      return { phase: "queued" };
    case "handle-required":
      return { phase: "handle-required" };
    case "duel-found":
      return startDuel(message);
    case "duel-resumed":
      return resumed(state, message);
    case "opponent-keystrokes":
      return updateDuel(state, (duel) => withOpponentKeystrokes(duel, message.keystrokes));
    case "resync":
      return updateDuel(state, (duel) => resynced(duel, message));
    case "opponent-disconnected":
      return updateDuel(state, (duel) => ({ ...duel, opponentConnected: false }));
    case "opponent-reconnected":
      return updateDuel(state, (duel) => ({ ...duel, opponentConnected: true }));
    case "duel-ended":
      return ended(message);
    case "replaced":
      return { phase: "replaced" };
    case "invalid-message":
      return state;
  }
};

// A key is a Keystroke only while the Duel runs: the Countdown and the end leave the store as is,
// Cues included.
const pressed = (store: DuelStore, key: Key, now: number): Pick<DuelStore, "state" | "cues"> => {
  const { state } = store;

  if (state.phase !== "running") {
    return store;
  }

  const { duel } = state;
  const keystroke: Keystroke = { ...key, at: now - duel.startsAt };

  // Past the end: the next frame ends the Duel.
  if (isFinished(duel.run, keystroke.at)) {
    return store;
  }

  queueKeystroke(keystroke);

  const keystrokes = [...duel.keystrokes, keystroke];
  const run = applyKeystroke(duel.run, keystroke);
  const score = scoreOf(duel.config, keystrokes, duel.pace);

  return {
    state: { phase: "running", duel: { ...duel, run, keystrokes, score } },
    cues: cuesOf({ run: duel.run, score: duel.score }, keystroke, { run, score }),
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

  return { phase: "finishing", duel: state.duel };
};

// The Duel connection, one per tab. Only the current socket's events count: a closed one
// (Annuler, StrictMode's double mount) may still deliver its last events. A connection lost during
// a Duel is opened again, and the server resumes the Duel.
export const useDuelStore = create<DuelStore>()((set, get) => {
  const open = () => {
    const current = openSocket();

    socket = current;

    current.subscribe(({ data }) => {
      if (socket === current) {
        // Connected again: a later loss gets its own attempts.
        reconnects = 0;
        set((store) => ({ state: stateAfter(store.state, data) }));
      }
    });
    current.on("close", () => {
      if (socket !== current) {
        return;
      }

      socket = null;

      const { state } = get();

      if (duelOf(state) !== null && reconnects < MAX_RECONNECTS) {
        reconnects += 1;
        reconnectTimer = setTimeout(open, RECONNECT_MS);
        set({ state: updateDuel(state, (duel) => ({ ...duel, connected: false })) });
      } else if (state.phase !== "replaced") {
        stopReconnecting();
        set({ state: { phase: "disconnected" } });
      }
    });
  };

  return {
    state: { phase: "connecting" },
    cues: [],
    connect: (tabClock, tabSocket = openApiSocket) => {
      socket?.close();
      stopReconnecting();
      clock = tabClock;
      openSocket = tabSocket;
      set({ state: { phase: "connecting" }, cues: [] });
      open();
    },
    disconnect: () => {
      const current = socket;
      const { state } = get();

      // Leaving on purpose once the time is up would forfeit a Duel whose verdict is on its way.
      if (state.phase === "countdown" || state.phase === "running") {
        send({ type: "leave-duel" });
      }

      socket = null;
      outbox = [];
      stopReconnecting();
      markDuelInProgress(false);
      current?.close();
    },
    joinQueue: () => send({ type: "join-queue" }),
    leave: () => send({ type: "leave-duel" }),
    press: (key, now) => set((store) => pressed(store, key, now)),
    tick: (now) =>
      set((store) => {
        const state = ticked(store.state, now);

        return state === store.state ? store : { state };
      }),
  };
});

// Only the User's Keystrokes leave new Cues: they go to the bus, outside of React. The opponent's,
// a resync or a reconnection leave them as they are.
useDuelStore.subscribe((store, previous) => {
  if (store.cues !== previous.cues) {
    emitCues(store.cues);
  }
});

// A reload in the middle of a Duel reopens Duel, to resume it (play-store).
useDuelStore.subscribe(({ state }) => {
  if (state.phase !== "connecting") {
    markDuelInProgress(duelOf(state) !== null);
  }
});
