import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

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

export const ClientMessage = t.Union([
  t.Object({ type: t.Literal("join-queue") }),
  t.Object({ type: t.Literal("leave-queue") }),
  t.Object({
    type: t.Literal("keystrokes"),
    keystrokes: t.Array(Keystroke, { maxItems: MAX_KEYSTROKES_PER_BATCH }),
  }),
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

const DuelOpponent = t.Object({ name: t.String(), image: t.Nullable(t.String()) });

export const ServerMessage = t.Union([
  t.Object({ type: t.Literal("queued") }),
  t.Object({
    type: t.Literal("duel-found"),
    duel: t.Object({
      id: t.String(),
      seed: t.Integer(),
      language: t.Union([t.Literal("fr"), t.Literal("en")]),
      wordListVersion: t.Integer(),
      // A `time` Duel of that many seconds.
      seconds: t.Integer(),
      // Server time, in ms since the epoch.
      startsAt: t.Number(),
    }),
    opponent: DuelOpponent,
    // The server's clock when it sent the message: the client derives its offset from it.
    serverTime: t.Number(),
  }),
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
  // The end, the same for both: each side gets its own outcome, its Result and the opponent's.
  t.Object({
    type: t.Literal("duel-ended"),
    outcome: t.Union([t.Literal("win"), t.Literal("loss"), t.Literal("draw")]),
    result: Result,
    opponentResult: Result,
  }),
  // Another connection of the same User took its place; the server closes this one.
  t.Object({ type: t.Literal("replaced") }),
  t.Object({ type: t.Literal("invalid-message") }),
]);

export type ServerMessage = typeof ServerMessage.static;
