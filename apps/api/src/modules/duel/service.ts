import type { Logger } from "pino";
import {
  ESTIMATED_WAIT_PAIRINGS,
  estimatedWait,
  matchWindow,
  nextWidening,
  PLACEMENT_DUELS,
  type Rating,
  seedMmr,
} from "ranked";
import { currentWordListVersion, defaultPace, type Keystroke } from "typing-engine";

import type { Clock } from "../../lib/clock";
import { type ChallengeArena, Challenges, type Seat } from "../challenge/service";
import type { FriendStore } from "../friend/store";
import type { Users } from "../user/users";
import type { ClientMessage, Form, ServerMessage } from "./model";
import { type DuelRecord, type DuelStore, readForm, readPace } from "./store";
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

// The Face-off (1.5 s), then the 3-2-1: typing is blocked all along.
const COUNTDOWN_MS = 4500;

// How long a player whose connection dropped has to come back before forfeiting.
const RECONNECT_GRACE_MS = 10_000;

// How long the end of a Duel waits for its write: past that, it is told without a Duel to replay.
export const SAVE_TIMEOUT_MS = 5000;

// The Queue's Users are told how it changed at most this often.
export const QUEUE_STATUS_MS = 1000;

// One WebSocket, seen from the Queue: the route adapts Elysia's to it.
export type Connection = {
  id: string;
  send: (message: ServerMessage) => void;
};

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

export type DuelQueueConfig = {
  clock: Clock;
  store: DuelStore;
  users: Users;
  // Where a Challenge checks the two are Friends.
  friendStore: FriendStore;
  logger: Logger;
  // Told when a User's Duel starts (at the pairing, Countdown included) and when it ends: their
  // Presence.
  onDuel: (userId: string, inDuel: boolean) => void;
  // Told once a finished Duel is written, never when the write failed or ran out of time.
  onDuelSaved: (record: DuelRecord) => void;
};

// A User in the Queue: their profile once read (they have a Handle), then their Pace and Form once
// read from their history, with their Rating (null when it could not be read: their Duel is not
// ranked), and when they joined: their wait widens the MMR window. Replaced by a new entry when
// they leave and join again.
type QueueEntry = {
  user: User | null;
  paced: { pace: number; form: Form | null; rating: Rating | null } | null;
  joinedAt: number;
};

type ReadyUser = PacedUser & { joinedAt: number };

// Two Users can face each other once their MMR gap fits the window of whichever has waited
// longer. Without a Rating, the Duel is not ranked: any MMR fits.
const fits = (a: ReadyUser, b: ReadyUser, now: number) =>
  a.rating === null ||
  b.rating === null ||
  Math.abs(a.rating.mmr - b.rating.mmr) <= matchWindow(now - Math.min(a.joinedAt, b.joinedAt));

// The Queue, the running Duels, the Challenges and the connected Users, in memory (ADR 0003). A User
// can have many connections (tabs, ADR 0007) but one place, in the Queue or in a Duel, played on
// one of them: the one that joined the Queue or resumed the Duel. The others are told the place and
// can take it; the Keystrokes and Duel actions they send are ignored. A Duel starts from the Queue
// or from an accepted Challenge.
export class DuelQueue implements ChallengeArena {
  readonly #clock: Clock;

  // Where finished Duels are written.
  readonly #store: DuelStore;

  // Where a joining User's Handle and avatar are read: the Session's may be minutes old.
  readonly #users: Users;

  readonly #logger: Logger;

  readonly #onDuel: DuelQueueConfig["onDuel"];

  readonly #onDuelSaved: DuelQueueConfig["onDuelSaved"];

  // Every open connection of each User, by connection id.
  readonly #connections = new Map<string, Map<string, Connection>>();

  // The connection each User plays their place on, until another one takes it or it closes.
  readonly #playing = new Map<string, Connection>();

  // User ids in arrival order. Queued Users always have a connection that plays: its closing drops
  // them.
  readonly #queue = new Map<string, QueueEntry>();

  // The write of each User's last Duel, until it is done: their Pace waits for it. It gives the id
  // the Duel was written under, null if the write failed.
  readonly #saving = new Map<string, Promise<string | null>>();

  // The Duel of each User in one, until it is over.
  readonly #duels = new Map<string, RunningDuel>();

  // Players whose Duel is over but not written yet: they are told its end once it is, and until
  // then the Duel is still their place.
  readonly #beingWritten = new Set<string>();

  // Players of a Duel whose playing connection dropped, each with a token of that disconnection:
  // their time to come back only runs out if they are still away from that one.
  readonly #away = new Map<string, symbol>();

  // The end of a Duel told to a player who was away then, to tell them on their return.
  readonly #missed = new Map<string, DuelEnded>();

  readonly #challenges: Challenges;

  // When the Queue next tries its pairings again, as a window widens: null if nothing waits for it.
  #nextPairAt: number | null = null;

  // How long each player of the last pairings of the Queue waited, the oldest first: the
  // Estimated wait. Challenges do not count.
  #recentWaits: number[] = [];

  // Whether the Queue's Users are to be told how it changed, once QUEUE_STATUS_MS has passed.
  #statusDue = false;

  constructor({ clock, store, users, friendStore, logger, onDuel, onDuelSaved }: DuelQueueConfig) {
    this.#clock = clock;
    this.#store = store;
    this.#users = users;
    this.#logger = logger;
    this.#onDuel = onDuel;
    this.#onDuelSaved = onDuelSaved;
    this.#challenges = new Challenges({ clock, users, friendStore, logger, arena: this });
  }

  // The new connection plays nothing yet: it is told the User's place, then their Challenges.
  connect(userId: string, connection: Connection) {
    const connections = this.#connections.get(userId) ?? new Map<string, Connection>();

    connections.set(connection.id, connection);
    this.#connections.set(userId, connections);
    connection.send(this.#placeOf(userId));
    this.#challenges.connect(userId, connection);
  }

  // Any connection can take the place or act on the Challenges; only the one that plays the place
  // acts in the Queue or the Duel.
  receive(userId: string, connectionId: string, message: ClientMessage) {
    const connection = this.connectionOf(userId, connectionId);

    if (!connection) {
      return;
    }

    switch (message.type) {
      case "join-queue":
        this.#join(userId, connection);

        return;
      case "resume-duel":
        this.#resumeOn(userId, connection);

        return;
      case "send-challenge":
      case "cancel-challenge":
      case "accept-challenge":
      case "decline-challenge":
        this.#challenges.receive(userId, connection, message);

        return;
    }

    if (this.#playing.get(userId) !== connection) {
      return;
    }

    switch (message.type) {
      case "leave-queue":
        this.#leaveQueue(userId);
        break;
      case "keystrokes":
        this.#type(userId, message.keystrokes);
        break;
      case "leave-duel":
        this.#leave(userId);
        break;
    }
  }

  // Closing a connection that does not play changes nothing. Closing the one that plays leaves the
  // Queue, but a player in a Duel keeps their place for a while: the opponent is told, and the time
  // to come back starts, until one of the User's connections resumes it.
  disconnect(userId: string, connectionId: string) {
    const connections = this.#connections.get(userId);

    connections?.delete(connectionId);

    if (connections?.size === 0) {
      this.#connections.delete(userId);
      this.#challenges.left(userId);
    }

    if (this.#playing.get(userId)?.id !== connectionId) {
      return;
    }

    this.#playing.delete(userId);
    this.#leaveQueue(userId);

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

  // Every open connection of the User: none once they are offline.
  connectionsOf(userId: string) {
    return [...(this.#connections.get(userId)?.values() ?? [])];
  }

  connectionOf(userId: string, connectionId: string) {
    return this.#connections.get(userId)?.get(connectionId);
  }

  // From the pairing (Countdown included) to the end, told once the Duel is written.
  isInDuel(userId: string) {
    return this.#duels.has(userId) || this.#beingWritten.has(userId);
  }

  // Their Challenges between them are over.
  friendsRemoved(a: string, b: string) {
    this.#challenges.friendsRemoved(a, b);
  }

  // A Duel from a Challenge: both leave the Queue if they were in it, and play it on the seats'
  // connections (an end they were not told is not told anymore, as when joining the Queue).
  startDuel(seats: readonly [Seat, Seat]) {
    for (const { user, connection } of seats) {
      if (this.#queue.get(user.id)?.user) {
        this.#queueChanged();
      }

      this.#queue.delete(user.id);
      this.#missed.delete(user.id);
      this.#playOn(user.id, connection);
    }

    this.#start(seats);
  }

  // To the connection that plays the User's place.
  #send(userId: string, message: ServerMessage) {
    this.#playing.get(userId)?.send(message);
  }

  // The User's place as a connection that does not play it is told. A Duel whose end they were not
  // told is still their place: only a connection that resumes it is told the end. Still being
  // read, the Queue is no place yet: it becomes one with `queued`.
  #placeOf(userId: string): ServerMessage {
    if (this.isInDuel(userId) || this.#missed.has(userId)) {
      return { type: "elsewhere", place: "duel" };
    }

    if (this.#queue.get(userId)?.user) {
      return { type: "elsewhere", place: "queue" };
    }

    return { type: "idle" };
  }

  // The place changed: every connection of the User that does not play it is told. The one that
  // plays learns it from its own messages.
  #tellOthers(userId: string) {
    const place = this.#placeOf(userId);
    const playing = this.#playing.get(userId);

    for (const connection of this.#connections.get(userId)?.values() ?? []) {
      if (connection !== playing) {
        connection.send(place);
      }
    }
  }

  // `connection` plays the User's place from now on: the one that played it until now is told
  // where it went.
  #playOn(userId: string, connection: Connection) {
    const previous = this.#playing.get(userId);

    this.#playing.set(userId, connection);

    const place = this.#placeOf(userId);

    if (previous && previous !== connection && place.type === "elsewhere") {
      previous.send(place);
    }
  }

  #leaveQueue(userId: string) {
    const entry = this.#queue.get(userId);

    this.#queue.delete(userId);

    if (entry?.user) {
      this.#tellOthers(userId);
      this.#queueChanged();
    }
  }

  // The Queue as a User in it sees it: `entry` is theirs.
  #statusOf(entry: QueueEntry): ServerMessage {
    let size = 0;

    for (const { user } of this.#queue.values()) {
      if (user !== null) {
        size += 1;
      }
    }

    return {
      type: "queue-status",
      joinedAt: entry.joinedAt,
      serverTime: this.#clock.now(),
      size,
      estimatedWait: estimatedWait(this.#recentWaits),
    };
  }

  // Someone entered or left the Queue: its Users are told, once QUEUE_STATUS_MS has passed, of
  // every change until then at once.
  #queueChanged() {
    if (this.#statusDue) {
      return;
    }

    this.#statusDue = true;
    this.#clock.at(this.#clock.now() + QUEUE_STATUS_MS, () => {
      this.#statusDue = false;

      for (const [userId, entry] of this.#queue) {
        if (entry.user !== null) {
          this.#send(userId, this.#statusOf(entry));
        }
      }
    });
  }

  // The same mechanism as a reconnection: the Duel goes on here, the connection that played it
  // until now is told, and the time to come back stops. A Duel that ended while no connection
  // played it: its end, told once, and the other connections that the User is idle. Otherwise,
  // ignored. A Duel over but not written yet: its end is told here once it is.
  #resumeOn(userId: string, connection: Connection) {
    const duel = this.#duels.get(userId);
    const missed = this.#missed.get(userId);

    if (duel) {
      this.#playOn(userId, connection);
      this.#resume(userId, duel);
    } else if (this.#beingWritten.has(userId)) {
      this.#playOn(userId, connection);
    } else if (missed) {
      this.#missed.delete(userId);
      this.#playOn(userId, connection);
      connection.send(missed);
      this.#tellOthers(userId);
    }
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
      opponentConnected: this.#playing.has(opponentId),
      ...duel.pairingOf(userId),
    });

    if (this.#away.delete(userId)) {
      this.#send(opponentId, { type: "opponent-reconnected" });
    }
  }

  // Once a Duel is over, it is written, then both players are free to join the Queue again. Their
  // Keystrokes are ignored from the end on. It ends once: at the end of its time, or on a Forfeit,
  // whichever comes first. A failed write is logged: the players are told the end all the same,
  // without a Duel to replay.
  #finish(duel: RunningDuel, finish: (now: number) => Finish) {
    if (duel.userIds.some((userId) => this.#duels.get(userId) !== duel)) {
      return;
    }

    const { endings, record } = finish(this.#clock.now());

    const saving = this.#write(record);

    void saving.then((duelId) => {
      if (duelId !== null) {
        this.#onDuelSaved(record);
      }
    });

    for (const { userId, message } of endings) {
      this.#duels.delete(userId);
      this.#away.delete(userId);
      this.#beingWritten.add(userId);
      this.#saving.set(userId, saving);
      void saving.then((duelId) => {
        if (this.#saving.get(userId) === saving) {
          this.#saving.delete(userId);
        }

        // Not written, no Rating moved.
        this.#tellEnd(userId, {
          ...message,
          duelId,
          ranked: duelId === null ? null : message.ranked,
        });
      });
    }
  }

  // The id the Duel is written under, or null: the write failed, or took longer than
  // SAVE_TIMEOUT_MS (the players are not held up by a database that hangs). Either is logged.
  #write(record: DuelRecord) {
    return new Promise<string | null>((resolve) => {
      let settled = false;

      const settle = (duelId: string | null) => {
        settled = true;
        resolve(duelId);
      };

      void this.#store.save(record).then(
        () => settle(record.id),
        (error) => {
          this.#logger.error({ err: error, duelId: record.id }, "finished duel not saved");
          settle(null);
        },
      );
      this.#clock.at(this.#clock.now() + SAVE_TIMEOUT_MS, () => {
        if (!settled) {
          this.#logger.warn({ duelId: record.id }, "finished duel not saved in time");
          settle(null);
        }
      });
    });
  }

  // The end, told on the connection that plays (or the next one that resumes the Duel), and to
  // their other connections that they are idle.
  #tellEnd(userId: string, message: DuelEnded) {
    this.#beingWritten.delete(userId);
    this.#onDuel(userId, false);

    // Nobody plays it: the Duel stays their place until a connection resumes it.
    if (this.#playing.has(userId)) {
      this.#send(userId, message);
      this.#tellOthers(userId);
    } else {
      this.#missed.set(userId, message);
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
  // is read. Joining again while in the Queue keeps their place, played on `connection` from now on.
  #join(userId: string, connection: Connection) {
    if (this.isInDuel(userId)) {
      return;
    }

    // Moving on: an end they were not told is not told anymore.
    this.#missed.delete(userId);
    this.#playOn(userId, connection);

    const queued = this.#queue.get(userId);

    if (queued) {
      if (queued.user !== null) {
        this.#send(userId, { type: "queued" });
        this.#send(userId, this.#statusOf(queued));
      }

      return;
    }

    const entry: QueueEntry = { user: null, paced: null, joinedAt: this.#clock.now() };

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
        this.#send(userId, this.#statusOf(entry));
        this.#tellOthers(userId);
        this.#queueChanged();
        void this.readPace(userId).then(async (pace) => {
          const [rating, form] = await Promise.all([
            this.#readRating(userId, pace),
            this.readForm(userId),
          ]);

          if (this.#queue.get(userId) === entry) {
            entry.paced = { pace, form, rating };
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
  async readPace(userId: string) {
    try {
      await this.#saving.get(userId);

      return await readPace(this.#store, userId);
    } catch (error) {
      this.#logger.error({ err: error, userId }, "pace not read");

      return defaultPace;
    }
  }

  // The User's Form, once their last Duel is written, as the Pace. Unreadable, null: shown as
  // absent, the Duel is played.
  async readForm(userId: string) {
    try {
      await this.#saving.get(userId);

      return await readForm(this.#store, userId);
    } catch (error) {
      this.#logger.error({ err: error, userId }, "form not read");

      return null;
    }
  }

  // The User's Rating, created from their Pace on their first join of the Queue (read once their
  // last Duel is written, as the Pace). Unreadable, null: their Duel is not ranked, and is played.
  async #readRating(userId: string, pace: number) {
    try {
      return await this.#store.ensureRating(userId, {
        mmr: seedMmr(pace),
        rank: { placementsLeft: PLACEMENT_DUELS },
      });
    } catch (error) {
      this.#logger.error({ err: error, userId }, "rating not read");

      return null;
    }
  }

  // Among the Users whose profile, Pace and Rating are read, in arrival order (a Map iterates in
  // insertion order): each one is paired with the first after them whose MMR fits the window. One
  // still being read holds up no one behind. They are distinct, the Queue holds User ids. Those
  // left unpaired are tried again when the next window widens.
  #pair() {
    const now = this.#clock.now();
    const ready: ReadyUser[] = [];

    for (const [userId, { user, paced, joinedAt }] of this.#queue) {
      if (this.#playing.has(userId) && user !== null && paced !== null) {
        ready.push({ user, ...paced, joinedAt });
      }
    }

    const waiting: ReadyUser[] = [];

    for (const b of ready) {
      const index = waiting.findIndex((a) => fits(a, b, now));
      const [a] = index === -1 ? [] : waiting.splice(index, 1);

      if (a) {
        this.#queue.delete(a.user.id);
        this.#queue.delete(b.user.id);
        this.#recentWaits.push(now - a.joinedAt, now - b.joinedAt);
        this.#recentWaits = this.#recentWaits.slice(-2 * ESTIMATED_WAIT_PAIRINGS);
        this.#queueChanged();
        this.#start([a, b]);
      } else {
        waiting.push(b);
      }
    }

    if (waiting.length > 1) {
      this.#pairAgain(waiting, now);
    }
  }

  // At the next widening of any window among `waiting`, unless a try is already set by then.
  #pairAgain(waiting: readonly ReadyUser[], now: number) {
    const widenings = waiting.flatMap(({ joinedAt }) => {
      const wait = nextWidening(now - joinedAt);

      return wait === null ? [] : [joinedAt + wait];
    });

    const at = Math.min(...widenings);

    if (!Number.isFinite(at) || (this.#nextPairAt !== null && this.#nextPairAt <= at)) {
      return;
    }

    this.#nextPairAt = at;
    this.#clock.at(at, () => {
      if (this.#nextPairAt === at) {
        this.#nextPairAt = null;
        this.#pair();
      }
    });
  }

  // Seed drawn here, same format for every Duel, the Countdown starting now. Each player is told on
  // the connection that plays, their other connections that the Duel is elsewhere; their
  // Challenges are over.
  #start([a, b]: readonly [PacedUser, PacedUser]) {
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
      this.#onDuel(user.id, true);
      this.#challenges.enteredDuel(user.id);
      this.#send(user.id, {
        type: "duel-found",
        duel: duel.duel,
        opponent: duel.opponentProfileOf(user.id),
        serverTime,
        ...duel.pairingOf(user.id),
      });
      this.#tellOthers(user.id);
    }
  }
}
