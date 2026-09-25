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

import type { Clock } from "@/components/run/clock-context";
import { emitCues } from "@/lib/cue-bus";
import { markDuelInProgress } from "@/lib/duel-in-progress";
import { onServerMessage, sendToServer, useConnectionStore } from "@/stores/connection-store";

type DuelFound = Extract<ServerMessage, { type: "duel-found" }>;

type DuelResumed = Extract<ServerMessage, { type: "duel-resumed" }>;

export type DuelOpponent = DuelFound["opponent"];

type DuelEnded = Extract<ServerMessage, { type: "duel-ended" }>;

// How the Duel ended for this User: their outcome, whether it was a Forfeit, their Result and
// Score and the opponent's, computed by the server from the Keystrokes it accepted. `duelId` is the
// Duel to replay, null if the server could not write it.
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
  // False while this tab's connection is lost and being opened again, until the Duel is resumed.
  connected: boolean;
  // False while the opponent's connection is lost: they have a few seconds to come back.
  opponentConnected: boolean;
};

export type DuelState =
  // Waiting for the User's place, to join the Queue or resume their Duel here.
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
  // Another tab of the same User plays the place: the Queue or the Duel.
  | { phase: "elsewhere" }
  // The Duel played here is gone while the connection was lost.
  | { phase: "disconnected" };

type DuelStore = {
  state: DuelState;
  // What the User's last Keystroke caused, never the opponent's (ADR 0006).
  cues: readonly Cue[];
  // Duel is shown in this tab: it takes the User's place, resuming their Duel or joining the
  // Queue. `clock` stamps the Keystrokes and the Countdown.
  enter: (clock: Clock) => void;
  // Duel is left: out of the Queue, and leaving a Duel in play is a Forfeit. The connection stays.
  exit: () => void;
  // Takes the place back here, from another tab or after losing the Duel.
  claim: () => void;
  // Nouveau Duel, once the previous one is over: back to the Queue.
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

// The Keystrokes are sent in small batches, at most this often.
const BATCH_MS = 50;

// Outside the store's state: nothing renders from them.
let clock: Clock = () => performance.now();

// Duel is shown in this tab: only then does it take the User's place.
let entered = false;

// The place was asked for since the last `connecting`: told it is held elsewhere afterwards,
// another tab took it, and this one does not take it back on its own.
let placeAsked = false;

// Typed Keystrokes not sent yet, and the timer that will send them.
let outbox: Keystroke[] = [];

let flushTimer: ReturnType<typeof setTimeout> | null = null;

const send = (message: ClientMessage) => sendToServer(message);

// Resumes the User's Duel here if they are in one, otherwise joins the Queue. The place unknown
// yet, the server's next message tells it.
const claimPlace = () => {
  const { place } = useConnectionStore.getState();

  if (place === null) {
    return;
  }

  placeAsked = true;
  send(place.at === "duel" ? { type: "resume-duel" } : { type: "join-queue" });
};

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

// Back in the Duel, played here from now on. The same Duel as this tab's (a lost connection) keeps its
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
  duelId,
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
    ending: { duelId, outcome, forfeit, result, opponentResult, score, opponentScore, opponent },
  };
};

// The User has no place. Waiting for it here: into the Queue. The Duel played here is gone (it ended
// while the connection was lost, and another tab was told the end).
const idle = (state: DuelState): DuelState => {
  if (!entered) {
    return state;
  }

  if (state.phase === "connecting") {
    placeAsked = true;
    send({ type: "join-queue" });

    return state;
  }

  return duelOf(state) === null ? state : { phase: "disconnected" };
};

// The User's place is not played here. Waiting for it: taken here, unless it was already asked
// for (another tab took it since). Back from a lost connection: the Duel is resumed. Otherwise,
// another tab took it.
const elsewhere = (state: DuelState): DuelState => {
  if (!entered) {
    return state;
  }

  if (state.phase === "connecting" && !placeAsked) {
    claimPlace();

    return state;
  }

  if (duelOf(state)?.connected === false) {
    send({ type: "resume-duel" });

    return state;
  }

  return { phase: "elsewhere" };
};

const stateAfter = (state: DuelState, message: ServerMessage): DuelState => {
  switch (message.type) {
    case "idle":
      return idle(state);
    case "elsewhere":
      return elsewhere(state);
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
    // The Friends: the connection store's.
    case "friends-snapshot":
    case "presence":
    case "friend-request-received":
    case "friend-request-removed":
    case "friend-added":
    case "friend-removed":
    // The Challenges too: an accepted one starts with `duel-found`.
    case "challenges-snapshot":
    case "challenge-received":
    case "challenge-sent":
    case "challenge-ended":
    case "challenge-refused":
    case "activity-added":
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

// The connection is lost: the server keeps the Duel played here for a few seconds, marked
// disconnected until resumed; it drops the User from the Queue, which they join again once back.
const lost = (state: DuelState): DuelState => {
  if (duelOf(state) !== null) {
    return updateDuel(state, (duel) => ({ ...duel, connected: false }));
  }

  if (state.phase === "queued" || state.phase === "connecting") {
    placeAsked = false;

    return { phase: "connecting" };
  }

  return state;
};

const clearOutbox = () => {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  outbox = [];
};

// The Duel as this tab plays it, on the app's connection (connection-store): it reads the server's
// messages and sends its own there, and only takes the User's place while Duel is shown.
export const useDuelStore = create<DuelStore>()((set, get) => ({
  state: { phase: "connecting" },
  cues: [],
  enter: (tabClock) => {
    clock = tabClock;
    entered = true;
    placeAsked = false;
    clearOutbox();
    set({ state: { phase: "connecting" }, cues: [] });
    claimPlace();
  },
  exit: () => {
    const { state } = get();

    // Leaving on purpose once the time is up would forfeit a Duel whose verdict is on its way.
    if (state.phase === "countdown" || state.phase === "running") {
      send({ type: "leave-duel" });
    } else if (state.phase === "queued" || state.phase === "connecting") {
      send({ type: "leave-queue" });
    }

    entered = false;
    clearOutbox();
    markDuelInProgress(false);
    set({ state: { phase: "connecting" }, cues: [] });
  },
  claim: () => {
    placeAsked = false;
    set({ state: { phase: "connecting" } });
    claimPlace();
  },
  joinQueue: () => send({ type: "join-queue" }),
  leave: () => send({ type: "leave-duel" }),
  press: (key, now) => set((store) => pressed(store, key, now)),
  tick: (now) =>
    set((store) => {
      const state = ticked(store.state, now);

      return state === store.state ? store : { state };
    }),
}));

onServerMessage((message) => {
  useDuelStore.setState((store) => ({ state: stateAfter(store.state, message) }));
});

useConnectionStore.subscribe(({ status }, previous) => {
  if (previous.status === "open" && status !== "open") {
    useDuelStore.setState((store) => ({ state: lost(store.state) }));
  }
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
