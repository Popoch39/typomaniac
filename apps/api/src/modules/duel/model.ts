import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

import { ActivityModel } from "../activity/model";
import { ChallengeModel } from "../challenge/model";
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
  // Accepts the User's Match proposal: they have one at a time.
  t.Object({ type: t.Literal("accept-proposal") }),
  // Declines it: out of the Queue, without losing anything. `leave-queue` during one does the same.
  t.Object({ type: t.Literal("decline-proposal") }),
  // The same socket carries the User's Challenges.
  ChallengeModel.challengeClientMessage,
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

// A User's visible rank past Placement (ranked package): a Tier and Division with TP, Maniac
// without Division. Never the MMR.
const Standing = t.Union([
  t.Object({
    tier: t.Union([
      t.Literal("fer"),
      t.Literal("bronze"),
      t.Literal("argent"),
      t.Literal("or"),
      t.Literal("platine"),
      t.Literal("diamant"),
    ]),
    division: t.Union([t.Literal(4), t.Literal(3), t.Literal(2), t.Literal(1)]),
    tp: t.Integer(),
    shielded: t.Boolean(),
  }),
  t.Object({ tier: t.Literal("maniac"), tp: t.Integer(), shielded: t.Boolean() }),
]);

// A Standing, or the Placement Duels still to play.
const Rank = t.Union([...Standing.anyOf, t.Object({ placementsLeft: t.Integer() })]);

// What a ranked Duel did to one User's rank: the TP it moved (null in Placement), their rank
// before and after.
const DuelRanked = t.Object({
  tp: t.Nullable(t.Integer()),
  previousRank: Rank,
  rank: Rank,
});

export type DuelRanked = typeof DuelRanked.static;

// What a win and a loss would do to a User's TP, by the rules the Duel applies (ranked package):
// the TP moved and the rank reached. Never the MMR, and no Draw.
const StakeOutcome = t.Object({ tp: t.Integer(), standing: Standing });

const Stake = t.Object({ win: StakeOutcome, loss: StakeOutcome });

// How a Duel ended for one of its players.
const DuelOutcome = t.Union([t.Literal("win"), t.Literal("loss"), t.Literal("draw")]);

export type DuelOutcome = typeof DuelOutcome.static;

// A User's Form, shown in the Face-off: the outcomes of their last Ranked Duels, the most recent
// first, and their average wpm over those.
const Form = t.Object({
  avgWpm: t.Number(),
  outcomes: t.Array(DuelOutcome),
});

export type Form = typeof Form.static;

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

const QueueStatus = t.Object({
  type: t.Literal("queue-status"),
  joinedAt: t.Number(),
  serverTime: t.Number(),
  size: t.Integer(),
  estimatedWait: t.Nullable(t.Number()),
});

export type QueueStatus = typeof QueueStatus.static;

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
  // The Queue as its Users see it while they wait, after `queued` and whenever it changes (at most
  // once a second): when they joined (server time, their wait survives a reload), how many Users
  // are in it, them included, and the Estimated wait in ms, null without a recent pairing.
  QueueStatus,
  // Refused the Queue: a Duel shows each player's Handle, and the User has none yet.
  t.Object({ type: t.Literal("handle-required") }),
  // Paired by the Queue: the User has until `expiresAt` (server time) to accept the Duel. Sent
  // again when they come back to it (`join-queue`, `resume-duel`), with who accepted so far. Each
  // player's rank, never their MMR.
  t.Object({
    type: t.Literal("match-proposed"),
    expiresAt: t.Number(),
    serverTime: t.Number(),
    opponent: DuelOpponent,
    selfRank: t.Nullable(Rank),
    opponentRank: t.Nullable(Rank),
    selfAccepted: t.Boolean(),
    opponentAccepted: t.Boolean(),
  }),
  t.Object({ type: t.Literal("opponent-accepted") }),
  // The Match proposal is over: both accepted, `duel-found` follows. Or the User declined it or
  // let its time run out: out of the Queue. Or their opponent did: back in the Queue a few seconds
  // later (`queued`), as when they joined, or at once on `join-queue`.
  t.Object({
    type: t.Literal("proposal-ended"),
    reason: t.Union([
      t.Literal("accepted"),
      t.Literal("declined"),
      t.Literal("missed"),
      t.Literal("opponent-declined"),
      t.Literal("opponent-missed"),
    ]),
  }),
  t.Object({
    type: t.Literal("duel-found"),
    duel: Duel,
    opponent: DuelOpponent,
    // The server's clock when it sent the message: the client derives its offset from it.
    serverTime: t.Number(),
    // Each player's Pace, in wpm, frozen for the Duel: the client scores both sides with them.
    pace: t.Number(),
    opponentPace: t.Number(),
    // Each player's rank at the pairing, shown in the Face-off, never their MMR; null for a
    // Challenge (never ranked) or when their Rating could not be read.
    selfRank: t.Nullable(Rank),
    opponentRank: t.Nullable(Rank),
    // Each player's Form at the pairing, a Challenge's too; null without a Ranked Duel or when
    // their Duels could not be read.
    selfForm: t.Nullable(Form),
    opponentForm: t.Nullable(Form),
    // This User's Stake, computed at the pairing, shown in the Face-off; null for a Challenge, in
    // Placement or without both Ratings (the Duel is not ranked). The opponent's is sent to no one.
    selfStake: t.Nullable(Stake),
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
    selfRank: t.Nullable(Rank),
    opponentRank: t.Nullable(Rank),
    selfForm: t.Nullable(Form),
    opponentForm: t.Nullable(Form),
    selfStake: t.Nullable(Stake),
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
  // connection of theirs played it: until then, their place is still the Duel. Told once the Duel
  // is written: `duelId` is the Duel to replay, null when the write failed (nothing to replay).
  t.Object({
    type: t.Literal("duel-ended"),
    duelId: t.Union([t.String(), t.Null()]),
    outcome: DuelOutcome,
    // The loser forfeited: left, did not come back in time, or typed at an inhuman rate.
    forfeit: t.Boolean(),
    result: Result,
    opponentResult: Result,
    score: DuelScore,
    opponentScore: DuelScore,
    opponent: DuelOpponent,
    // The User's rank moved by a Duel of the Queue; null for a Challenge (never ranked) and when
    // the Duel was not written (nothing moved).
    ranked: t.Nullable(DuelRanked),
  }),
  t.Object({ type: t.Literal("invalid-message") }),
  // The same socket tells the User of their Friends: Presence, Friend requests, Friends.
  FriendLiveModel.friendMessage,
  // And of their Challenges, sent and received.
  ChallengeModel.challengeMessage,
  // And of their Friends' Activity.
  ActivityModel.activityMessage,
  ActivityModel.arrivalMessage,
]);

export type ServerMessage = typeof ServerMessage.static;

// The Duel protocol, both ways.
export const DuelModel = {
  clientMessage: ClientMessage,
  serverMessage: ServerMessage,
  queueStatus: QueueStatus,
  opponent: DuelOpponent,
  duel: Duel,
  keystroke: Keystroke,
  result: Result,
  score: DuelScore,
  rank: Rank,
  standing: Standing,
};
