import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

// Bun closes a connection whose message is larger: no message of the protocol comes close.
export const MAX_DUEL_MESSAGE_SIZE = 16 * 1024;

export const ClientMessage = t.Union([
  t.Object({ type: t.Literal("join-queue") }),
  t.Object({ type: t.Literal("leave-queue") }),
]);

export type ClientMessage = typeof ClientMessage.static;

// Parsed by hand, not through the route's `body`: Elysia would answer a malformed message
// with an HTTP error body, outside the protocol.
export const clientMessage = TypeCompiler.Compile(ClientMessage);

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
      // Server time, in ms since the epoch.
      startsAt: t.Number(),
    }),
    opponent: DuelOpponent,
    // The server's clock when it sent the message: the client derives its offset from it.
    serverTime: t.Number(),
  }),
  // Another connection of the same User took its place; the server closes this one.
  t.Object({ type: t.Literal("replaced") }),
  t.Object({ type: t.Literal("invalid-message") }),
]);

export type ServerMessage = typeof ServerMessage.static;
