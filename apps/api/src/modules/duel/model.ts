import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

import { FriendLiveModel } from "../friend/model";

// Bun closes a connection whose message is larger: no message of the protocol comes close.
export const MAX_DUEL_MESSAGE_SIZE = 16 * 1024;

// A batch holds the Keystrokes of ~50 ms: far fewer than this.
const MAX_KEYSTROKES_PER_BATCH = 100;

// A Keystroke of typing-engine, `at` in ms since the start of the Duel, stamped by the client.
const Keystroke = t.Union([
  t.Object({
    kind: t.Literal("char"),
    char: t.String({ minLength: 1, maxLength: 1 }),
    at: t.Number(),
  }),
  t.Object({ kind: t.Literal("backspace"), at: t.Number() }),
  t.Object({ kind: t.Literal("deleteWord"), at: t.Number() }),
]);

const ClientMessage = t.Union([
  t.Object({ type: t.Literal("join-queue") }),
  t.Object({ type: t.Literal("leave-queue") }),
  t.Object({
    type: t.Literal("keystrokes"),
    keystrokes: t.Array(Keystroke, { maxItems: MAX_KEYSTROKES_PER_BATCH }),
  }),
  // Leaving on purpose: a Forfeit.
  t.Object({ type: t.Literal("leave-duel") }),
  // Plays the User's Duel on this connection from now on: after a reconnection, a reload, from
  // another tab.
  t.Object({ type: t.Literal("resume-duel") }),
]);

export type ClientMessage = typeof ClientMessage.static;

// Parsed by hand, not through the route's `body`: Elysia would answer a malformed message
// with an HTTP error body, outside the protocol.
export const clientMessage = TypeCompiler.Compile(ClientMessage);

// A Result of typing-engine, computed by the server from the Keystrokes it accepted.
const Result = t.Object({
  wpm: t.Number(),
  raw: t.Number(),
  accuracy: t.Number(),
  consistency: t.Number(),
  chars: t.Object({
    correct: t.Integer(),
    incorrect: t.Integer(),
    extra: t.Integer(),
    missed: t.Integer(),
  }),
});

// A player's Score at the end of a Duel, computed by the server from the Keystrokes it accepted:
// the points, the best Combo and how many Bursts.
const DuelScore = t.Object({
  score: t.Integer(),
  bestCombo: t.Integer(),
  bursts: t.Integer(),
});

export type DuelScore = typeof DuelScore.static;

// What a player sees of the other: their Handle of the moment and their avatar, never their name.
const DuelOpponent = t.Object({ handle: t.String(), image: t.Nullable(t.String()) });

const Duel = t.Object({
  id: t.String(),
  seed: t.Integer(),
  language: t.Union([t.Literal("fr"), t.Literal("en")]),
  wordListVersion: t.Integer(),
  // A `time` Duel of that many seconds.
  seconds: t.Integer(),
  // Server time, in ms since the epoch.
  startsAt: t.Number(),
});

export type Duel = typeof Duel.static;

// Every connection of a User is told their place: the one that plays it by the messages below, the
// others by `idle` and `elsewhere`, on connection and whenever it changes.
const ServerMessage = t.Union([
  // The User has no place: neither in the Queue nor in a Duel. `duel-ended` makes them idle too.
  t.Object({ type: t.Literal("idle") }),
  // The User has a place that this connection does not play: another one holds it, or none does
  // while they come back to their Duel. `join-queue` or `resume-duel` plays it here.
  t.Object({
    type: t.Literal("elsewhere"),
    place: t.Union([t.Literal("queue"), t.Literal("duel")]),
  }),
  t.Object({ type: t.Literal("queued") }),
  // Refused the Queue: a Duel shows each player's Handle, and the User has none yet.
  t.Object({ type: t.Literal("handle-required") }),
  t.Object({
    type: t.Literal("duel-found"),
    duel: Duel,
    opponent: DuelOpponent,
    // The server's clock when it sent the message: the client derives its offset from it.
    serverTime: t.Number(),
    // Each player's Pace, in wpm, frozen for the Duel: the client scores both sides with them.
    pace: t.Number(),
    opponentPace: t.Number(),
  }),
  // The User's Duel, played on this connection from now on (`resume-duel`): the Duel as
  // `duel-found` gives it, plus the state that holds, as `resync` gives it.
  t.Object({
    type: t.Literal("duel-resumed"),
    duel: Duel,
    opponent: DuelOpponent,
    serverTime: t.Number(),
    keystrokes: t.Array(Keystroke),
    received: t.Integer(),
    opponentKeystrokes: t.Array(Keystroke),
    // False while the opponent is disconnected, within their time to come back.
    opponentConnected: t.Boolean(),
    pace: t.Number(),
    opponentPace: t.Number(),
  }),
  // The opponent's connection dropped: they have a few seconds to come back, or forfeit.
  t.Object({ type: t.Literal("opponent-disconnected") }),
  t.Object({ type: t.Literal("opponent-reconnected") }),
  // The opponent's Keystrokes the server accepted, in order: the client replays them.
  t.Object({ type: t.Literal("opponent-keystrokes"), keystrokes: t.Array(Keystroke) }),
  // The state that holds after a rejected Keystroke: every Keystroke the server accepted from each
  // side, and how many it received from this client. The client keeps what it sent past those.
  t.Object({
    type: t.Literal("resync"),
    keystrokes: t.Array(Keystroke),
    received: t.Integer(),
    opponentKeystrokes: t.Array(Keystroke),
  }),
  // The end, the same for both: each side gets its own outcome, its Result and Score and the
  // opponent's. Sent on `resume-duel` too to a User who missed the end of their Duel while no
  // connection of theirs played it: until then, their place is still the Duel.
  t.Object({
    type: t.Literal("duel-ended"),
    outcome: t.Union([t.Literal("win"), t.Literal("loss"), t.Literal("draw")]),
    // The loser forfeited: left, did not come back in time, or typed at an inhuman rate.
    forfeit: t.Boolean(),
    result: Result,
    opponentResult: Result,
    score: DuelScore,
    opponentScore: DuelScore,
    opponent: DuelOpponent,
  }),
  t.Object({ type: t.Literal("invalid-message") }),
  // The same socket tells the User of their Friends: Presence, Friend requests, Friends.
  FriendLiveModel.friendMessage,
]);

export type ServerMessage = typeof ServerMessage.static;

// The Duel protocol, both ways.
export const DuelModel = { clientMessage: ClientMessage, serverMessage: ServerMessage };
