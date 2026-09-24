import type { Logger } from "pino";
import { currentWordListVersion, defaultPace, type Keystroke } from "typing-engine";

import type { Clock } from "../../lib/clock";
import type { Users } from "../user/users";
import type { ClientMessage, ServerMessage } from "./model";
import { type DuelStore, readPace } from "./store";
import {
  type DuelEnded,
  type Finish,
  type PacedUser,
  RunningDuel,
  type User,
} from "./running-duel";

// Every Duel has the same format: `time` 30 s in English.
const DUEL_LANGUAGE = "en";

const DUEL_SECONDS = 30;

const COUNTDOWN_MS = 3000;

// How long a player whose connection dropped has to come back before forfeiting.
const RECONNECT_GRACE_MS = 10_000;

// One WebSocket, seen from the Queue: the route adapts Elysia's to it.
export type Connection = {
  id: string;
  send: (message: ServerMessage) => void;
  close: () => void;
};

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

export type DuelQueueConfig = { clock: Clock; store: DuelStore; users: Users; logger: Logger };

// A User in the Queue: their profile once read (they have a Handle), then their Pace once read
// from their history. Replaced by a new entry when they leave and join again.
type QueueEntry = { user: User | null; pace: number | null };

// The Queue, the running Duels and the connected Users, in memory (ADR 0003). A User has one
// place, in the Queue or in a Duel: a new connection replaces the previous one and takes over
// its place. Only the current connection of a User is listened to.
export class DuelQueue {
  readonly #clock: Clock;

  // Where finished Duels are written.
  readonly #store: DuelStore;

  // Where a joining User's Handle and avatar are read: the Session's may be minutes old.
  readonly #users: Users;

  readonly #logger: Logger;

  readonly #connected = new Map<string, Connection>();

  // User ids in arrival order. Queued Users are always connected: leaving drops them.
  readonly #queue = new Map<string, QueueEntry>();

  // The write of each User's last Duel, until it is done: their Pace waits for it.
  readonly #saving = new Map<string, Promise<void>>();

  // The Duel of each User in one, until it is over.
  readonly #duels = new Map<string, RunningDuel>();

  // Players of a Duel whose connection dropped, each with a token of that disconnection: their
  // time to come back only runs out if they are still away from that one.
  readonly #away = new Map<string, symbol>();

  // The end of a Duel told to a player who was away then, to tell them on their return.
  readonly #missed = new Map<string, DuelEnded>();

  constructor({ clock, store, users, logger }: DuelQueueConfig) {
    this.#clock = clock;
    this.#store = store;
    this.#users = users;
    this.#logger = logger;
  }

  // The new connection is told the User's place: in a Duel (resumed), in the Queue, or none. A
  // Duel that ended in their absence is told first.
  connect(userId: string, connection: Connection) {
    const previous = this.#connected.get(userId);

    this.#connected.set(userId, connection);

    if (previous) {
      previous.send({ type: "replaced" });
      previous.close();
    }

    const duel = this.#duels.get(userId);
    const missed = this.#missed.get(userId);

    if (duel) {
      this.#resume(userId, duel);
    } else if (missed) {
      this.#missed.delete(userId);
      connection.send(missed);
    } else if (this.#queue.has(userId)) {
      connection.send({ type: "queued" });
    } else {
      connection.send({ type: "idle" });
    }
  }

  receive(userId: string, connectionId: string, message: ClientMessage) {
    if (!this.#isCurrent(userId, connectionId)) {
      return;
    }

    switch (message.type) {
      case "join-queue":
        this.#join(userId);
        break;
      case "leave-queue":
        this.#queue.delete(userId);
        break;
      case "keystrokes":
        this.#type(userId, message.keystrokes);
        break;
      case "leave-duel":
        this.#leave(userId);
        break;
    }
  }

  // Also called for a replaced connection, once closed: it has no place left to free. A player in
  // a Duel keeps their place for a while: the opponent is told, and the time to come back starts.
  disconnect(userId: string, connectionId: string) {
    if (!this.#isCurrent(userId, connectionId)) {
      return;
    }

    this.#connected.delete(userId);
    this.#queue.delete(userId);

    const duel = this.#duels.get(userId);

    if (!duel) {
      return;
    }

    const away = Symbol(userId);

    this.#away.set(userId, away);
    this.#send(duel.opponentOf(userId), { type: "opponent-disconnected" });
    this.#clock.at(this.#clock.now() + RECONNECT_GRACE_MS, () => {
      if (this.#away.get(userId) === away) {
        this.#forfeit(duel, userId);
      }
    });
  }

  #isCurrent(userId: string, connectionId: string) {
    return this.#connected.get(userId)?.id === connectionId;
  }

  #send(userId: string, message: ServerMessage) {
    this.#connected.get(userId)?.send(message);
  }

  // Back in their Duel: the full state that holds, and the opponent is told if they were away.
  #resume(userId: string, duel: RunningDuel) {
    const opponentId = duel.opponentOf(userId);

    this.#send(userId, {
      type: "duel-resumed",
      duel: duel.duel,
      opponent: duel.opponentProfileOf(userId),
      serverTime: this.#clock.now(),
      ...duel.stateOf(userId),
      opponentConnected: this.#connected.has(opponentId),
      ...duel.pacesOf(userId),
    });

    if (this.#away.delete(userId)) {
      this.#send(opponentId, { type: "opponent-reconnected" });
    }
  }

  // Once a Duel is over, it is written, both players are free to join the Queue again and their
  // Keystrokes are ignored. It ends once: at the end of its time, or on a Forfeit, whichever comes
  // first. A failed write is logged: the players are told the end all the same.
  #finish(duel: RunningDuel, finish: (now: number) => Finish) {
    if (duel.userIds.some((userId) => this.#duels.get(userId) !== duel)) {
      return;
    }

    const { endings, record } = finish(this.#clock.now());

    const saving = this.#store.save(record).catch((error) => {
      this.#logger.error({ err: error, duelId: record.id }, "finished duel not saved");
    });

    for (const { userId, message } of endings) {
      this.#duels.delete(userId);
      this.#away.delete(userId);
      this.#saving.set(userId, saving);
      void saving.then(() => {
        if (this.#saving.get(userId) === saving) {
          this.#saving.delete(userId);
        }
      });

      if (this.#connected.has(userId)) {
        this.#send(userId, message);
      } else {
        this.#missed.set(userId, message);
      }
    }
  }

  // `userId` forfeits: they left, did not come back in time, or typed at an inhuman rate.
  #forfeit(duel: RunningDuel, userId: string) {
    this.#finish(duel, (now) => duel.forfeit(userId, now));
  }

  #leave(userId: string) {
    const duel = this.#duels.get(userId);

    if (duel) {
      this.#forfeit(duel, userId);
    }
  }

  // The accepted Keystrokes go to the opponent; a rejected one resyncs the sender; an inhuman
  // cadence is a Forfeit.
  #type(userId: string, keystrokes: readonly Keystroke[]) {
    const duel = this.#duels.get(userId);

    if (!duel) {
      return;
    }

    const { accepted, rejected, flooded } = duel.receive(userId, keystrokes, this.#clock.now());

    if (flooded) {
      this.#forfeit(duel, userId);

      return;
    }

    if (accepted.length > 0) {
      this.#send(duel.opponentOf(userId), { type: "opponent-keystrokes", keystrokes: accepted });
    }

    if (rejected) {
      this.#send(userId, { type: "resync", ...duel.stateOf(userId) });
    }
  }

  // A User in a running Duel keeps their place in it. Joining reads their profile: without a
  // Handle, they are refused. Then their Pace, frozen for their next Duel: they are paired once it
  // is read. Joining again while in the Queue keeps their place.
  #join(userId: string) {
    if (this.#duels.has(userId)) {
      return;
    }

    const queued = this.#queue.get(userId);

    if (queued) {
      if (queued.user !== null) {
        this.#send(userId, { type: "queued" });
      }

      return;
    }

    const entry: QueueEntry = { user: null, pace: null };

    this.#queue.set(userId, entry);
    void this.#users.profileOf(userId).then(
      (profile) => {
        if (this.#queue.get(userId) !== entry) {
          return;
        }

        if (!profile?.handle) {
          this.#queue.delete(userId);
          this.#send(userId, { type: "handle-required" });

          return;
        }

        entry.user = { id: userId, handle: profile.handle, image: profile.image };
        this.#send(userId, { type: "queued" });
        void this.#readPace(userId).then((pace) => {
          if (this.#queue.get(userId) === entry) {
            entry.pace = pace;
            this.#pair();
          }
        });
      },
      // Unreadable: out of the Queue. Without the opponent's Handle there is no Duel to show.
      (error) => {
        this.#logger.error({ err: error, userId }, "profile not read");

        if (this.#queue.get(userId) === entry) {
          this.#queue.delete(userId);
        }
      },
    );
  }

  // The median wpm of the User's last Duels, once their last one is written (engine's paceOf).
  // Unreadable, the default Pace: a Duel is never held up by the database.
  async #readPace(userId: string) {
    try {
      await this.#saving.get(userId);

      return await readPace(this.#store, userId);
    } catch (error) {
      this.#logger.error({ err: error, userId }, "pace not read");

      return defaultPace;
    }
  }

  // FIFO among the Users whose profile and Pace are read: one still being read holds up no one
  // behind (a Map iterates in insertion order). They are distinct, the Queue holds User ids.
  #pair() {
    const ready: PacedUser[] = [];

    for (const [userId, { user, pace }] of this.#queue) {
      if (this.#connected.has(userId) && user !== null && pace !== null) {
        ready.push({ user, pace });
      }

      if (ready.length === 2) {
        break;
      }
    }

    const [a, b] = ready;

    if (!a || !b) {
      return;
    }

    this.#queue.delete(a.user.id);
    this.#queue.delete(b.user.id);

    const serverTime = this.#clock.now();

    const duel = new RunningDuel(
      {
        id: crypto.randomUUID(),
        seed: randomSeed(),
        language: DUEL_LANGUAGE,
        wordListVersion: currentWordListVersion[DUEL_LANGUAGE],
        seconds: DUEL_SECONDS,
        startsAt: serverTime + COUNTDOWN_MS,
      },
      [a, b],
    );

    this.#duels.set(a.user.id, duel);
    this.#duels.set(b.user.id, duel);
    this.#clock.at(duel.endsAt, () => this.#finish(duel, () => duel.end()));

    for (const { user } of [a, b]) {
      this.#send(user.id, {
        type: "duel-found",
        duel: duel.duel,
        opponent: duel.opponentProfileOf(user.id),
        serverTime,
        ...duel.pacesOf(user.id),
      });
    }
  }
}
