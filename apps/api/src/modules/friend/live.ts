import type { Logger } from "pino";

import type { Clock } from "../../lib/clock";
import type { Activity, ActivityMessage, ArrivalMessage } from "../activity/model";
import { duelActivity, friendshipActivity } from "../activity/service";
import type { DuelRecord } from "../duel/store";
import type { HandleMatch, Users } from "../user/users";
import type { FriendMessage, Presence } from "./model";
import { type FriendStore, orderedPair } from "./store";

// One WebSocket of a User, seen from their Friends: the Duel route hands its own to it.
export type FriendConnection = {
  id: string;
  send: (message: FriendMessage | ActivityMessage | ArrivalMessage) => void;
};

// What the Friend routes tell once they wrote, for the Users concerned to be told live.
export type FriendEvents = {
  requestSent: (senderId: string, recipientId: string) => void;
  // Cancelled by the sender, or declined by the recipient: only the recipient is told, a refusal
  // is silent.
  requestRemoved: (senderId: string, recipientId: string) => void;
  friendsAdded: (a: string, b: string) => void;
  friendsRemoved: (a: string, b: string) => void;
};

export type FriendsLiveConfig = { store: FriendStore; users: Users; clock: Clock; logger: Logger };

// What the Duel socket tells: each connection, each Duel.
export type PresenceEvents = Pick<FriendsLive, "connect" | "disconnect" | "setInDuel">;

// Each User of a friendship, with the other.
const bothWays = (a: string, b: string) =>
  [
    [a, b],
    [b, a],
  ] as const;

// A change of friendship notified while the User's Friends are being read.
type Change = { friendId: string; friends: boolean };

// The Presence of the connected Users and what their Friends see of it, in memory (ADR 0003, 0007).
// The Presence is derived, never written: offline without a connection, in a Duel from the
// Countdown to the end, online otherwise. The Friends of each connected User are read from the
// store on their first connection, then kept up to date by the Friend routes' notifications.
export class FriendsLive implements FriendEvents {
  readonly #store: FriendStore;

  readonly #users: Users;

  readonly #clock: Clock;

  readonly #logger: Logger;

  // Every open connection of each User, by connection id.
  readonly #connections = new Map<string, Map<string, FriendConnection>>();

  readonly #inDuel = new Set<string>();

  // The Friends of each connected User, once read.
  readonly #friends = new Map<string, Set<string>>();

  // The Users whose Friends are being read, with the changes notified meanwhile: applied once
  // read, the read may already hold them (adding or deleting twice from a Set changes nothing).
  readonly #reading = new Map<string, { done: Promise<void>; changes: Change[] }>();

  // For each User, the connected Users whose Friends are read and count them: those told their
  // Presence. Kept from the watchers' side, it does not wait for the User's own read.
  readonly #watchers = new Map<string, Set<string>>();

  // The messages of each User that need a read, sent in the order they were asked for.
  readonly #outbox = new Map<string, Promise<void>>();

  constructor({ store, users, clock, logger }: FriendsLiveConfig) {
    this.#store = store;
    this.#users = users;
    this.#clock = clock;
    this.#logger = logger;
  }

  // The first connection puts the User online for their Friends. Each one gets the snapshot.
  connect(userId: string, connection: FriendConnection) {
    const connections = this.#connections.get(userId) ?? new Map<string, FriendConnection>();
    const before = this.presenceOf(userId);

    connections.set(connection.id, connection);
    this.#connections.set(userId, connections);
    this.#tellIfChanged(userId, before);

    if (before === "offline") {
      this.#tellArrival(userId);
    }

    this.#later(userId, async () => {
      await this.#readFriends(userId);

      const requestsReceived = await this.#requestsReceived(userId);

      if (!this.#isOpen(userId, connection)) {
        return;
      }

      connection.send({
        type: "friends-snapshot",
        presences: [...(this.#friends.get(userId) ?? [])].map((friendId) => ({
          userId: friendId,
          presence: this.presenceOf(friendId),
        })),
        requestsReceived,
      });
    });
  }

  // The last one closed puts the User offline for their Friends, and forgets theirs.
  disconnect(userId: string, connectionId: string) {
    const connections = this.#connections.get(userId);

    if (!connections?.delete(connectionId) || connections.size > 0) {
      return;
    }

    this.#connections.delete(userId);
    this.#tell(userId);
    this.#reading.delete(userId);

    for (const friendId of this.#friends.get(userId) ?? []) {
      this.#unwatch(userId, friendId);
    }

    this.#friends.delete(userId);
  }

  // From the Countdown to the end of their Duel.
  setInDuel(userId: string, inDuel: boolean) {
    const before = this.presenceOf(userId);

    if (inDuel) {
      this.#inDuel.add(userId);
    } else {
      this.#inDuel.delete(userId);
    }

    this.#tellIfChanged(userId, before);
  }

  presenceOf(userId: string): Presence {
    if (!this.#connections.has(userId)) {
      return "offline";
    }

    return this.#inDuel.has(userId) ? "in-duel" : "online";
  }

  requestSent(senderId: string, recipientId: string) {
    this.#tellRequest("friend-request-received", senderId, recipientId);
  }

  requestRemoved(senderId: string, recipientId: string) {
    this.#tellRequest("friend-request-removed", senderId, recipientId);
  }

  friendsAdded(a: string, b: string) {
    for (const [userId, friendId] of bothWays(a, b)) {
      this.#change(userId, { friendId, friends: true });
      this.#later(userId, async () => {
        const requestsReceived = await this.#requestsReceived(userId);

        this.#sendTo(userId, {
          type: "friend-added",
          userId: friendId,
          presence: this.presenceOf(friendId),
          requestsReceived,
        });
      });
    }

    const friendship = { pair: orderedPair(a, b), createdAt: this.#clock.now() };

    this.#tellActivity([a, b], (friends, profiles) =>
      friendshipActivity(friendship, friends, profiles),
    );
  }

  // A finished Duel once written, to the Friends of either player: those of both once, each player
  // too when the other is their Friend.
  duelSaved(record: DuelRecord) {
    const duel = {
      id: record.id,
      endedAt: record.endedAt,
      outcome: record.outcome,
      winnerId: record.winnerId,
      players: record.players.map(({ userId, result }) => ({ userId, wpm: result.wpm })),
    };

    this.#tellActivity(
      duel.players.map((player) => player.userId),
      (friends, profiles) => duelActivity(duel, friends, profiles),
    );
  }

  friendsRemoved(a: string, b: string) {
    for (const [userId, friendId] of bothWays(a, b)) {
      this.#change(userId, { friendId, friends: false });
      this.#later(userId, async () => {
        this.#sendTo(userId, { type: "friend-removed", userId: friendId });
      });
    }
  }

  // To the recipient only, with the count of the requests they now have waiting.
  #tellRequest(
    type: "friend-request-received" | "friend-request-removed",
    senderId: string,
    recipientId: string,
  ) {
    this.#later(recipientId, async () => {
      this.#sendTo(recipientId, {
        type,
        userId: senderId,
        requestsReceived: await this.#requestsReceived(recipientId),
      });
    });
  }

  #isOpen(userId: string, connection: FriendConnection) {
    return this.#connections.get(userId)?.get(connection.id) === connection;
  }

  #sendTo(userId: string, message: FriendMessage | ActivityMessage | ArrivalMessage) {
    for (const connection of this.#connections.get(userId)?.values() ?? []) {
      connection.send(message);
    }
  }

  // Their Presence, to every Friend who watches it, at once: it needs no read, so it may reach a
  // tab before its snapshot or a `friend-added`. Those are right all the same: they read the
  // Presence when they are sent, after it.
  #tell(userId: string) {
    const message: FriendMessage = {
      type: "presence",
      userId,
      presence: this.presenceOf(userId),
    };

    for (const watcherId of this.#watchers.get(userId) ?? []) {
      this.#sendTo(watcherId, message);
    }
  }

  // An Activity of `userIds`, to each connected User who watches one of them (their Friends), seen
  // from them: the profiles are read once for all. A failed read is logged.
  #tellActivity(
    userIds: readonly string[],
    activityFor: (
      friends: ReadonlySet<string>,
      profiles: ReadonlyMap<string, HandleMatch>,
    ) => Activity[],
  ) {
    const watchers = new Set(userIds.flatMap((userId) => [...(this.#watchers.get(userId) ?? [])]));

    if (watchers.size === 0) {
      return;
    }

    this.#users.profilesOf(userIds).then(
      (found) => {
        const profiles = new Map(found.map((user) => [user.id, user]));

        for (const watcherId of watchers) {
          const friends = this.#friends.get(watcherId);

          for (const activity of friends ? activityFor(friends, profiles) : []) {
            this.#sendTo(watcherId, { type: "activity-added", activity });
          }
        }
      },
      (error) => {
        this.#logger.error({ err: error, userIds }, "activity not told");
      },
    );
  }

  // The User just came online, from offline, to every Friend who watches them: never written, so
  // never read back. A failed read of their profile is logged.
  #tellArrival(userId: string) {
    const watchers = this.#watchers.get(userId);

    if (!watchers || watchers.size === 0) {
      return;
    }

    const at = this.#clock.now();

    this.#users.profilesOf([userId]).then(
      ([user]) => {
        // Gone again while the profile was read: no arrival to tell.
        if (!user || this.presenceOf(userId) === "offline") {
          return;
        }

        const arrival = {
          id: crypto.randomUUID(),
          at,
          friend: { id: user.id, handle: user.handle, image: user.image },
        };

        // Read again: the watchers may have changed during the read.
        for (const watcherId of this.#watchers.get(userId) ?? []) {
          this.#sendTo(watcherId, { type: "friend-arrived", arrival });
        }
      },
      (error) => {
        this.#logger.error({ err: error, userId }, "arrival not told");
      },
    );
  }

  #tellIfChanged(userId: string, before: Presence) {
    if (this.presenceOf(userId) !== before) {
      this.#tell(userId);
    }
  }

  // Runs `task` after the ones asked before for this User, and only while they are connected: a
  // User without a connection is told nothing, and nothing is read for them. A failed read is
  // logged: the messages after it go on.
  #later(userId: string, task: () => Promise<void>) {
    if (!this.#connections.has(userId)) {
      return;
    }

    const next = (this.#outbox.get(userId) ?? Promise.resolve()).then(task).catch((error) => {
      this.#logger.error({ err: error, userId }, "friends not told");
    });

    this.#outbox.set(userId, next);
    void next.then(() => {
      if (this.#outbox.get(userId) === next) {
        this.#outbox.delete(userId);
      }
    });
  }

  async #requestsReceived(userId: string) {
    return (await this.#store.requestsOf(userId)).received.length;
  }

  // Once per connected User: their other connections wait for the same read. Forgotten when they
  // leave before it is done.
  #readFriends(userId: string): Promise<void> {
    if (this.#friends.has(userId)) {
      return Promise.resolve();
    }

    const pending = this.#reading.get(userId);

    if (pending) {
      return pending.done;
    }

    const changes: Change[] = [];

    const done = this.#store.friendIds(userId).then(
      (friendIds) => {
        if (this.#reading.get(userId)?.changes !== changes) {
          return;
        }

        this.#reading.delete(userId);

        const friends = new Set(friendIds);

        this.#friends.set(userId, friends);

        for (const friendId of friends) {
          this.#watch(userId, friendId);
        }

        for (const change of changes) {
          this.#change(userId, change);
        }
      },
      (error) => {
        if (this.#reading.get(userId)?.changes === changes) {
          this.#reading.delete(userId);
        }

        throw error;
      },
    );

    this.#reading.set(userId, { done, changes });

    return done;
  }

  // Applied to their Friends once read, kept for then while they are being read, ignored for a
  // User who is not connected: they read them on their next connection.
  #change(userId: string, change: Change) {
    const friends = this.#friends.get(userId);

    if (!friends) {
      this.#reading.get(userId)?.changes.push(change);

      return;
    }

    if (change.friends) {
      friends.add(change.friendId);
      this.#watch(userId, change.friendId);
    } else {
      friends.delete(change.friendId);
      this.#unwatch(userId, change.friendId);
    }
  }

  #watch(watcherId: string, friendId: string) {
    const watchers = this.#watchers.get(friendId) ?? new Set<string>();

    watchers.add(watcherId);
    this.#watchers.set(friendId, watchers);
  }

  #unwatch(watcherId: string, friendId: string) {
    const watchers = this.#watchers.get(friendId);

    watchers?.delete(watcherId);

    if (watchers?.size === 0) {
      this.#watchers.delete(friendId);
    }
  }
}
