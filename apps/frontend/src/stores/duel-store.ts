import type { ClientMessage, ServerMessage } from "api";
import {
  applyKeystroke,
  isFinished,
  type Key,
  type Keystroke,
  replayRun,
  type RunConfig,
  type RunState,
} from "typing-engine";
import { create } from "zustand";

import { api } from "@/api/client";
import type { Clock } from "@/components/run/clock-context";
import { markDuelInProgress } from "@/lib/duel-in-progress";

type DuelFound = Extract<ServerMessage, { type: "duel-found" }>;

type DuelResumed = Extract<ServerMessage, { type: "duel-resumed" }>;

export type DuelOpponent = DuelFound["opponent"];

type DuelEnded = Extract<ServerMessage, { type: "duel-ended" }>;

// How the Duel ended for this User: their outcome, whether it was a Forfeit, their Result and the
// opponent's, computed by the server from the Keystrokes it accepted.
export type DuelEnding = Omit<DuelEnded, "type">;

// A Duel as this tab plays it. Both Runs are replayed by the engine: this User's from the
// Keystrokes typed here, the opponent's from those the server relays.
export type DuelPlay = {
  id: string;
  opponent: DuelOpponent;
  config: RunConfig & { mode: "time" };
  // The start on this tab's clock: the server's `startsAt` shifted by the clock offset.
  startsAt: number;
  run: RunState;
  // Every Keystroke typed here, sent or not yet.
  keystrokes: readonly Keystroke[];
  opponentRun: RunState;
  opponentKeystrokes: readonly Keystroke[];
  // False while this tab's connection is lost and being opened again.
  connected: boolean;
  // False while the opponent's connection is lost: they have a few seconds to come back.
  opponentConnected: boolean;
};

export type DuelState =
  | { phase: "connecting" }
  | { phase: "queued" }
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
  // Opens the Duel socket: the server resumes the User's Duel, or they join the Queue. `clock`
  // stamps the Keystrokes and the Countdown.
  connect: (clock: Clock) => void;
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

type DuelSocket = ReturnType<typeof api.duel.subscribe>;

// The Keystrokes are sent in small batches, at most this often.
const BATCH_MS = 50;

// A lost connection during a Duel is opened again this often, this many times: past the server's
// 10 s to come back, the Duel is over anyway.
const RECONNECT_MS = 1000;

const MAX_RECONNECTS = 15;

// Outside the store's state: nothing renders from them.
let socket: DuelSocket | null = null;

let clock: Clock = () => performance.now();

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
      run: replayRun(config, played.keystrokes),
      keystrokes: played.keystrokes,
      opponentRun: replayRun(config, played.opponentKeystrokes),
      opponentKeystrokes: played.opponentKeystrokes,
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
    opponentRun: replayRun(duel.config, opponentKeystrokes),
    opponentKeystrokes,
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

const withOpponentKeystrokes = (duel: DuelPlay, keystrokes: readonly Keystroke[]) => ({
  ...duel,
  opponentRun: keystrokes.reduce(applyKeystroke, duel.opponentRun),
  opponentKeystrokes: [...duel.opponentKeystrokes, ...keystrokes],
});

// Applies a change to the Duel while it is played, up to the server's end.
const updateDuel = (state: DuelState, update: (duel: DuelPlay) => DuelPlay): DuelState =>
  state.phase === "countdown" || state.phase === "running" || state.phase === "finishing"
    ? { ...state, duel: update(state.duel) }
    : state;

// The server ends the Duel, possibly before this tab's time is up: nothing typed here counts
// anymore. Also told on connection when the Duel ended while this User was away.
const ended = ({ outcome, forfeit, result, opponentResult, opponent }: DuelEnded): DuelState => {
  outbox = [];

  return { phase: "ended", ending: { outcome, forfeit, result, opponentResult, opponent } };
};

const stateAfter = (state: DuelState, message: ServerMessage): DuelState => {
  switch (message.type) {
    // No place on the server (nothing to resume): into the Queue.
    case "idle":
      send({ type: "join-queue" });

      return state;
    case "queued":
      return { phase: "queued" };
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

  return { phase: "finishing", duel: state.duel };
};

// The Duel connection, one per tab. Only the current socket's events count: a closed one
// (Annuler, StrictMode's double mount) may still deliver its last events. A connection lost during
// a Duel is opened again, and the server resumes the Duel.
export const useDuelStore = create<DuelStore>()((set, get) => {
  const open = () => {
    const current = api.duel.subscribe();

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
    connect: (tabClock) => {
      socket?.close();
      stopReconnecting();
      clock = tabClock;
      set({ state: { phase: "connecting" } });
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
    press: (key, now) => set((store) => ({ state: pressed(store.state, key, now) })),
    tick: (now) =>
      set((store) => {
        const state = ticked(store.state, now);

        return state === store.state ? store : { state };
      }),
  };
});

// A reload in the middle of a Duel reopens Duel, to resume it (play-store).
useDuelStore.subscribe(({ state }) => {
  if (state.phase !== "connecting") {
    markDuelInProgress(duelOf(state) !== null);
  }
});
