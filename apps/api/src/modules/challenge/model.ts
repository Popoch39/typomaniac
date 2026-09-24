import { t } from "elysia";

// Why sending a Challenge is refused: the front says what went wrong.
export const CHALLENGE_REFUSALS = [
  // The User has no Handle yet: a Duel shows each player's.
  "handle-required",
  "self",
  "not-friends",
  // The Friend has no tab open.
  "offline",
  // The Friend, or the User, is in a Duel.
  "in-duel",
  // The User already has a Challenge waiting: one at a time.
  "already-challenging",
] as const;

// How a Challenge ended: accepted (the Duel starts), declined by its recipient, cancelled by its
// sender, not answered in time, or made impossible (one of the two left, entered a Duel, accepted
// another Challenge, or the friendship ended).
export const CHALLENGE_ENDINGS = [
  "accepted",
  "declined",
  "cancelled",
  "expired",
  "unavailable",
] as const;

// The other User of a Challenge: their Handle and avatar, never their name.
const otherUser = t.Object({
  id: t.String(),
  handle: t.String(),
  image: t.Nullable(t.String()),
});

// In server time, ms since the epoch: the client shifts it by the `serverTime` it came with.
const expiresAt = t.Number();

const receivedChallenge = t.Object({ id: t.String(), from: otherUser, expiresAt });

const sentChallenge = t.Object({ id: t.String(), to: otherUser, expiresAt });

const challengeId = t.String();

// What the User sends of their Challenges, on the Duel socket (ADR 0007).
const challengeClientMessage = t.Union([
  t.Object({ type: t.Literal("send-challenge"), userId: t.String() }),
  t.Object({ type: t.Literal("cancel-challenge"), challengeId }),
  // The Duel is played on the connection that accepts.
  t.Object({ type: t.Literal("accept-challenge"), challengeId }),
  t.Object({ type: t.Literal("decline-challenge"), challengeId }),
]);

// What every connection of a User is told of their Challenges, sent and received.
const challengeMessage = t.Union([
  // On connection: the Challenges waiting.
  t.Object({
    type: t.Literal("challenges-snapshot"),
    sent: t.Nullable(sentChallenge),
    received: t.Array(receivedChallenge),
    serverTime: t.Number(),
  }),
  t.Object({
    type: t.Literal("challenge-received"),
    challenge: receivedChallenge,
    serverTime: t.Number(),
  }),
  // The User's Challenge waits for its recipient's answer.
  t.Object({ type: t.Literal("challenge-sent"), challenge: sentChallenge, serverTime: t.Number() }),
  // Sent or received, it is over.
  t.Object({
    type: t.Literal("challenge-ended"),
    challengeId,
    reason: t.UnionEnum(CHALLENGE_ENDINGS),
  }),
  // To the connection that sent it only: nothing was sent.
  t.Object({
    type: t.Literal("challenge-refused"),
    userId: t.String(),
    reason: t.UnionEnum(CHALLENGE_REFUSALS),
  }),
]);

export const ChallengeModel = { challengeClientMessage, challengeMessage };

export type ChallengeClientMessage = typeof challengeClientMessage.static;

export type ChallengeMessage = typeof challengeMessage.static;

export type ChallengeRefusal = (typeof CHALLENGE_REFUSALS)[number];

export type ChallengeEnding = (typeof CHALLENGE_ENDINGS)[number];
