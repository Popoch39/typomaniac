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
  // Each player's rank at the pairing, never their MMR; null for a Challenge or when the server
  // could not read their Rating.
  selfRank: DuelFound["selfRank"];
  opponentRank: DuelFound["opponentRank"];
  // Each player's Form at the pairing; null without a Ranked Duel.
  selfForm: DuelFound["selfForm"];
  opponentForm: DuelFound["opponentForm"];
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

type QueueStatus = Extract<ServerMessage, { type: "queue-status" }>;

// The Queue as the User waits in it, null until the server tells it: when they joined, on this
// tab's clock, how many Users are in it, them included, and the Estimated wait in ms (null
// without a recent pairing).
export type QueueView = {
  joinedAt: number;
  size: number;
  estimatedWait: number | null;
};

type MatchProposed = Extract<ServerMessage, { type: "match-proposed" }>;

type ProposalEnded = Extract<ServerMessage, { type: "proposal-ended" }>;

// Where the User's Match proposal stands, as the dialog shows it: to answer, accepted and waiting
// for the opponent, accepted by both (the Duel follows), or over without a Duel, as the server
// said why (the User declined or let the time run out, or the opponent did).
export type ProposalStage =
  | "pending"
  | "accepted"
  | "ready"
  | Exclude<ProposalEnded["reason"], "accepted">;

// A Match proposal as this tab shows it: until when to answer, on this tab's clock, the opponent,
// both ranks (never the MMR) and whether each accepted (kept once the time ran out).
export type ProposalView = {
  stage: ProposalStage;
  expiresAt: number;
  opponent: DuelOpponent;
  selfRank: MatchProposed["selfRank"];
  opponentRank: MatchProposed["opponentRank"];
  selfAccepted: boolean;
  opponentAccepted: boolean;
};

export type DuelState =
  // Waiting for the User's place, to join the Queue or resume their Duel here.
  | { phase: "connecting" }
  | { phase: "queued"; queue: QueueView | null }
  // Paired by the Queue: the Duel waits for both to accept it. The Queue's place still.
  | { phase: "proposed"; proposal: ProposalView }
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
  // Accepts or declines the Match proposal, while it waits for this User's answer. Leaving Duel
  // during one declines it too (`exit`: the server takes `leave-queue` as such).
  acceptProposal: () => void;
  declineProposal: () => void;
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

// The Queue's status, while waiting in it: its join time shifted onto this tab's clock as the
// Duel's start is.
const withQueueStatus = (state: DuelState, status: QueueStatus): DuelState =>
  state.phase === "queued"
    ? {
        phase: "queued",
        queue: {
          joinedAt: status.joinedAt - status.serverTime + clock(),
          size: status.size,
          estimatedWait: status.estimatedWait,
        },
      }
    : state;

// The Match proposal, its end shifted onto this tab's clock as the Duel's start is.
const proposedState = (message: MatchProposed): DuelState => ({
  phase: "proposed",
  proposal: {
    stage: message.selfAccepted ? "accepted" : "pending",
    expiresAt: message.expiresAt - message.serverTime + clock(),
    opponent: message.opponent,
    selfRank: message.selfRank,
    opponentRank: message.opponentRank,
    selfAccepted: message.selfAccepted,
    opponentAccepted: message.opponentAccepted,
  },
});

// Applies a change to the Match proposal, while it is shown.
const updateProposal = (
  state: DuelState,
  update: (proposal: ProposalView) => ProposalView,
): DuelState =>
  state.phase === "proposed" ? { phase: "proposed", proposal: update(state.proposal) } : state;

// Each User's acceptance is kept as it was: the dialog still shows who was ready.
const proposalEnded = (state: DuelState, { reason }: ProposalEnded) =>
  updateProposal(state, (proposal) =>
    reason === "accepted"
      ? { ...proposal, stage: "ready", selfAccepted: true, opponentAccepted: true }
      : { ...proposal, stage: reason },
  );

// The User's answer, while the Match proposal waits for it: told to the server, shown at once.
const answered = (state: DuelState, stage: "accepted" | "declined") =>
  updateProposal(state, (proposal) => ({
    ...proposal,
    stage,
    selfAccepted: stage === "accepted",
  }));

const awaitsAnswer = (state: DuelState) =>
  state.phase === "proposed" && state.proposal.stage === "pending";

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
      selfRank: message.selfRank,
      opponentRank: message.opponentRank,
      selfForm: message.selfForm,
      opponentForm: message.opponentForm,
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
  ranked,
}: DuelEnded): DuelState => {
  outbox = [];

  return {
    phase: "ended",
    ending: {
      duelId,
      outcome,
      forfeit,
      result,
      opponentResult,
      score,
      opponentScore,
      opponent,
      ranked,
    },
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
      return { phase: "queued", queue: state.phase === "queued" ? state.queue : null };
    case "queue-status":
      return withQueueStatus(state, message);
    case "handle-required":
      return { phase: "handle-required" };
    case "match-proposed":
      return proposedState(message);
    case "opponent-accepted":
      return updateProposal(state, (proposal) => ({ ...proposal, opponentAccepted: true }));
    case "proposal-ended":
      return proposalEnded(state, message);
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
    case "friend-arrived":
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

// The Queue's place, or on the way to it: waiting in the Queue or its Match proposal.
const inQueuePlace = ({ phase }: DuelState) =>
  phase === "queued" || phase === "proposed" || phase === "connecting";

// The connection is lost: the server keeps the Duel played here for a few seconds, marked
// disconnected until resumed; it drops the User from the Queue, which they join again once back.
const lost = (state: DuelState): DuelState => {
  if (duelOf(state) !== null) {
    return updateDuel(state, (duel) => ({ ...duel, connected: false }));
  }

  // The server keeps a Match proposal: joining the Queue again brings it back.
  if (inQueuePlace(state)) {
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
    } else if (inQueuePlace(state)) {
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
  acceptProposal: () => {
    const { state } = get();

    if (awaitsAnswer(state)) {
      send({ type: "accept-proposal" });
      set({ state: answered(state, "accepted") });
    }
  },
  declineProposal: () => {
    const { state } = get();

    if (awaitsAnswer(state)) {
      send({ type: "decline-proposal" });
      set({ state: answered(state, "declined") });
    }
  },
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
