import type { Logger } from "pino";

import type { Clock } from "../../lib/clock";
import type { Form } from "../duel/model";
import type { PacedUser, User } from "../duel/running-duel";
import type { Connection } from "../duel/service";
import type { FriendStore } from "../friend/store";
import type { Users } from "../user/users";
import type {
  ChallengeClientMessage,
  ChallengeEnding,
  ChallengeMessage,
  ChallengeRefusal,
} from "./model";

// How long a Challenge waits for its recipient's answer.
export const CHALLENGE_MS = 30_000;

// A player of a Duel started by a Challenge, with the connection that plays it.
export type Seat = PacedUser & { connection: Connection };

// What the Challenges need of the Duels: the Users' connections, who is in a Duel or a Match
// proposal, their Pace and Form, and starting one. The Duel Queue.
export type ChallengeArena = {
  connectionsOf: (userId: string) => Connection[];
  connectionOf: (userId: string, connectionId: string) => Connection | undefined;
  isInDuel: (userId: string) => boolean;
  isProposed: (userId: string) => boolean;
  readPace: (userId: string) => Promise<number>;
  readForm: (userId: string) => Promise<Form | null>;
  // Out of the Queue if they were in it, the Duel played on the seats' connections.
  startDuel: (seats: readonly [Seat, Seat]) => void;
};

export type ChallengesConfig = {
  clock: Clock;
  users: Users;
  friendStore: FriendStore;
  logger: Logger;
  arena: ChallengeArena;
};

type Challenge = {
  id: string;
  from: User;
  to: User;
  // The connection it was sent from: the Duel is played there, if it is still open.
  fromConnectionId: string;
  expiresAt: number;
  // Accepted, the Duel being set up: it no longer expires, nor can be cancelled or declined.
  accepting: boolean;
};

type Snapshot = Extract<ChallengeMessage, { type: "challenges-snapshot" }>;

// Who the two are, once read: both have a Handle and are Friends. Or why not.
type Checked = { from: User; to: User } | { refusal: ChallengeRefusal };

// The Challenges waiting, in memory with the Queue and the Duels (ADR 0003): at most one sent per
// User, as many received as their Friends send. Every connection of both Users is told of each.
export class Challenges {
  readonly #clock: Clock;

  readonly #users: Users;

  readonly #friendStore: FriendStore;

  readonly #logger: Logger;

  readonly #arena: ChallengeArena;

  // By id.
  readonly #challenges = new Map<string, Challenge>();

  // The Challenge each sender has being checked, which counts as their one sent: to whom, and
  // whether their friendship ended meanwhile (the read may predate it).
  readonly #sending = new Map<string, { toId: string; unfriended: boolean }>();

  constructor({ clock, users, friendStore, logger, arena }: ChallengesConfig) {
    this.#clock = clock;
    this.#users = users;
    this.#friendStore = friendStore;
    this.#logger = logger;
    this.#arena = arena;
  }

  // Each new connection is told the Challenges waiting, sent and received.
  connect(userId: string, connection: Connection) {
    let sent: Snapshot["sent"] = null;
    const received: Snapshot["received"] = [];

    for (const { id, from, to, expiresAt } of this.#challenges.values()) {
      if (from.id === userId) {
        sent = { id, to: shownOf(to), expiresAt };
      } else if (to.id === userId) {
        received.push({ id, from: shownOf(from), expiresAt });
      }
    }

    connection.send({
      type: "challenges-snapshot",
      sent,
      received,
      serverTime: this.#clock.now(),
    });
  }

  receive(userId: string, connection: Connection, message: ChallengeClientMessage) {
    switch (message.type) {
      case "send-challenge":
        this.#send(userId, connection, message.userId);
        break;
      // Neither once accepted: the Duel is being set up.
      case "cancel-challenge":
        this.#answer(
          message.challengeId,
          (challenge) => challenge.from.id === userId && !challenge.accepting,
          "cancelled",
        );
        break;
      case "decline-challenge":
        this.#answer(
          message.challengeId,
          (challenge) => challenge.to.id === userId && !challenge.accepting,
          "declined",
        );
        break;
      case "accept-challenge":
        this.#accept(userId, connection, message.challengeId);
        break;
    }
  }

  // Their last connection closed: nobody can play their Challenges anymore.
  left(userId: string) {
    this.#endWhere((challenge) => involves(challenge, userId), "unavailable");
  }

  // In a Match proposal, or in a Duel from its Countdown: their other Challenges are over.
  engaged(userId: string) {
    this.left(userId);
  }

  // The Challenges between them are over, and one being sent will be refused.
  friendsRemoved(a: string, b: string) {
    this.#endWhere((challenge) => involves(challenge, a) && involves(challenge, b), "unavailable");

    for (const [senderId, sending] of this.#sending) {
      if ((senderId === a && sending.toId === b) || (senderId === b && sending.toId === a)) {
        sending.unfriended = true;
      }
    }
  }

  // Why `fromId` cannot challenge `toId` right now, from what the Duels know.
  #unavailable(fromId: string, toId: string): ChallengeRefusal | null {
    if (this.#arena.connectionsOf(toId).length === 0) {
      return "offline";
    }

    if (this.#arena.isInDuel(fromId) || this.#arena.isInDuel(toId)) {
      return "in-duel";
    }

    return null;
  }

  // Seen online by their Friends, yet not free to play a Challenge.
  #proposed(fromId: string, toId: string) {
    return this.#arena.isProposed(fromId) || this.#arena.isProposed(toId);
  }

  #sentBy(userId: string) {
    if (this.#sending.has(userId)) {
      return true;
    }

    for (const { from } of this.#challenges.values()) {
      if (from.id === userId) {
        return true;
      }
    }

    return false;
  }

  // The checks that need no read first, then the Handle and the friendship. Anything may have
  // changed meanwhile: checked again once read.
  #send(userId: string, connection: Connection, toId: string) {
    const refuse = (reason: ChallengeRefusal) =>
      connection.send({ type: "challenge-refused", userId: toId, reason });

    if (toId === userId) {
      refuse("self");

      return;
    }

    if (this.#sentBy(userId)) {
      refuse("already-challenging");

      return;
    }

    const unavailable = this.#unavailable(userId, toId);

    if (unavailable) {
      refuse(unavailable);

      return;
    }

    const sending = { toId, unfriended: false };

    this.#sending.set(userId, sending);
    void this.#check(userId, toId)
      .then((checked) => {
        if ("refusal" in checked) {
          refuse(checked.refusal);

          return;
        }

        if (sending.unfriended) {
          refuse("not-friends");

          return;
        }

        // Gone meanwhile: there is nobody left to tell.
        if (this.#arena.connectionsOf(userId).length === 0) {
          return;
        }

        const now = this.#unavailable(userId, toId);

        if (now) {
          refuse(now);

          return;
        }

        this.#open({ ...checked, fromConnectionId: connection.id });
      })
      .catch((error) => {
        this.#logger.error({ err: error, userId }, "challenge not sent");
      })
      .finally(() => {
        if (this.#sending.get(userId) === sending) {
          this.#sending.delete(userId);
        }
      });
  }

  async #check(fromId: string, toId: string): Promise<Checked> {
    const [from, to, relations] = await Promise.all([
      this.#users.profileOf(fromId),
      this.#users.profileOf(toId),
      this.#friendStore.relationsWith(fromId, [toId]),
    ]);

    if (!from?.handle) {
      return { refusal: "handle-required" };
    }

    if (relations.get(toId) !== "friend" || !to?.handle) {
      return { refusal: "not-friends" };
    }

    return {
      from: { id: fromId, handle: from.handle, image: from.image },
      to: { id: toId, handle: to.handle, image: to.image },
    };
  }

  // Waits for its answer until it expires; both are told.
  #open({ from, to, fromConnectionId }: Pick<Challenge, "from" | "to" | "fromConnectionId">) {
    const serverTime = this.#clock.now();

    const challenge: Challenge = {
      id: crypto.randomUUID(),
      from,
      to,
      fromConnectionId,
      expiresAt: serverTime + CHALLENGE_MS,
      accepting: false,
    };

    this.#challenges.set(challenge.id, challenge);
    this.#clock.at(challenge.expiresAt, () => {
      if (!challenge.accepting) {
        this.#end(challenge, "expired");
      }
    });

    const { id, expiresAt } = challenge;

    this.#tell(to.id, {
      type: "challenge-received",
      challenge: { id, from: shownOf(from), expiresAt },
      serverTime,
    });
    this.#tell(from.id, {
      type: "challenge-sent",
      challenge: { id, to: shownOf(to), expiresAt },
      serverTime,
    });

    // Either is in a Match proposal: it cannot be played.
    if (this.#proposed(from.id, to.id)) {
      this.#end(challenge, "unavailable");
    }
  }

  // Cancelled or declined, by the User it allows.
  #answer(
    challengeId: string,
    allowed: (challenge: Challenge) => boolean,
    reason: ChallengeEnding,
  ) {
    const challenge = this.#challenges.get(challengeId);

    if (challenge && allowed(challenge)) {
      this.#end(challenge, reason);
    }
  }

  // Both still there, free and Friends, once their Paces are read: the Duel starts on the connection
  // that accepted and the one that sent (another of the sender's, if that one closed). Otherwise it
  // is over.
  #accept(userId: string, connection: Connection, challengeId: string) {
    const challenge = this.#challenges.get(challengeId);

    if (!challenge || challenge.to.id !== userId || challenge.accepting) {
      return;
    }

    const { from, to } = challenge;

    if (this.#unavailable(from.id, to.id) || this.#proposed(from.id, to.id)) {
      this.#end(challenge, "unavailable");

      return;
    }

    challenge.accepting = true;
    void Promise.all([
      this.#friendStore.relationsWith(from.id, [to.id]),
      this.#arena.readPace(from.id),
      this.#arena.readPace(to.id),
      this.#arena.readForm(from.id),
      this.#arena.readForm(to.id),
    ]).then(
      ([relations, fromPace, toPace, fromForm, toForm]) => {
        if (this.#challenges.get(challengeId) !== challenge) {
          return;
        }

        const toConnection = this.#arena.connectionOf(to.id, connection.id);

        const fromConnection =
          this.#arena.connectionOf(from.id, challenge.fromConnectionId) ??
          this.#arena.connectionsOf(from.id)[0];

        if (
          relations.get(to.id) !== "friend" ||
          !toConnection ||
          !fromConnection ||
          this.#unavailable(from.id, to.id) ||
          this.#proposed(from.id, to.id)
        ) {
          this.#end(challenge, "unavailable");

          return;
        }

        this.#end(challenge, "accepted");
        // A Challenge is never ranked: no Rating.
        this.#arena.startDuel([
          { user: from, pace: fromPace, form: fromForm, rating: null, connection: fromConnection },
          { user: to, pace: toPace, form: toForm, rating: null, connection: toConnection },
        ]);
      },
      (error) => {
        this.#logger.error({ err: error, challengeId }, "challenge not accepted");
        this.#end(challenge, "unavailable");
      },
    );
  }

  #endWhere(matches: (challenge: Challenge) => boolean, reason: ChallengeEnding) {
    // Deleting the entry being visited is safe while iterating a Map.
    for (const challenge of this.#challenges.values()) {
      if (matches(challenge)) {
        this.#end(challenge, reason);
      }
    }
  }

  // Once: both are told.
  #end(challenge: Challenge, reason: ChallengeEnding) {
    if (this.#challenges.get(challenge.id) !== challenge) {
      return;
    }

    this.#challenges.delete(challenge.id);

    const message: ChallengeMessage = {
      type: "challenge-ended",
      challengeId: challenge.id,
      reason,
    };

    this.#tell(challenge.from.id, message);
    this.#tell(challenge.to.id, message);
  }

  // Every connection of the User.
  #tell(userId: string, message: ChallengeMessage) {
    for (const connection of this.#arena.connectionsOf(userId)) {
      connection.send(message);
    }
  }
}

// What the other User is shown.
const shownOf = ({ id, handle, image }: User) => ({ id, handle, image });

const involves = ({ from, to }: Challenge, userId: string) =>
  from.id === userId || to.id === userId;
