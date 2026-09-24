import { currentWordListVersion, type Keystroke } from "typing-engine";

import type { Clock } from "../clock";
import type { ClientMessage, ServerMessage } from "./protocol";
import { RunningDuel } from "./running-duel";

// Every Duel has the same format: `time` 30 s in English.
const DUEL_LANGUAGE = "en";

const DUEL_SECONDS = 30;

const COUNTDOWN_MS = 3000;

// A User as the Duel sees them: who they are and what the opponent is shown.
export type User = { id: string; name: string; image: string | null };

// One WebSocket, seen from the Queue: the route adapts Elysia's to it.
export type Connection = {
  id: string;
  send: (message: ServerMessage) => void;
  close: () => void;
};

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

// The Queue, the running Duels and the connected Users, in memory (ADR 0003). A User has one
// place, in the Queue or in a Duel: a new connection replaces the previous one and takes over
// its place. Only the current connection of a User is listened to.
export class DuelQueue {
  readonly #clock: Clock;

  readonly #connected = new Map<string, { user: User; connection: Connection }>();

  // User ids in arrival order. Queued Users are always connected: leaving drops them.
  readonly #queue = new Set<string>();

  // The Duel of each User in one, until they leave it once it is over.
  readonly #duels = new Map<string, RunningDuel>();

  constructor(clock: Clock) {
    this.#clock = clock;
  }

  connect(user: User, connection: Connection) {
    const previous = this.#connected.get(user.id);

    this.#connected.set(user.id, { user, connection });

    if (previous) {
      previous.connection.send({ type: "replaced" });
      previous.connection.close();
    }

    if (this.#queue.has(user.id)) {
      connection.send({ type: "queued" });
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
    }
  }

  // Also called for a replaced connection, once closed: it has no place left to free.
  disconnect(userId: string, connectionId: string) {
    if (!this.#isCurrent(userId, connectionId)) {
      return;
    }

    this.#connected.delete(userId);
    this.#queue.delete(userId);
  }

  #isCurrent(userId: string, connectionId: string) {
    return this.#connected.get(userId)?.connection.id === connectionId;
  }

  #send(userId: string, message: ServerMessage) {
    this.#connected.get(userId)?.connection.send(message);
  }

  // Both players get the same Results; once told, they are free to join the Queue again and
  // their Keystrokes are ignored.
  #end(duel: RunningDuel) {
    for (const { userId, message } of duel.end()) {
      this.#duels.delete(userId);
      this.#send(userId, message);
    }
  }

  // The accepted Keystrokes go to the opponent; a rejected one resyncs the sender.
  #type(userId: string, keystrokes: readonly Keystroke[]) {
    const duel = this.#duels.get(userId);

    if (!duel) {
      return;
    }

    const { accepted, rejected } = duel.receive(userId, keystrokes, this.#clock.now());

    if (accepted.length > 0) {
      this.#send(duel.opponentOf(userId), { type: "opponent-keystrokes", keystrokes: accepted });
    }

    if (rejected) {
      this.#send(userId, { type: "resync", ...duel.stateOf(userId) });
    }
  }

  // A User in a running Duel keeps their place in it.
  #join(userId: string) {
    if (this.#duels.has(userId)) {
      return;
    }

    this.#queue.add(userId);
    this.#connected.get(userId)?.connection.send({ type: "queued" });
    this.#pair();
  }

  // FIFO: the two first Users of the Queue (a Set iterates in insertion order). They are
  // distinct, the Queue holds User ids.
  #pair() {
    const [first, second] = this.#queue;

    const a = typeof first === "undefined" ? undefined : this.#connected.get(first);
    const b = typeof second === "undefined" ? undefined : this.#connected.get(second);

    if (!a || !b) {
      return;
    }

    this.#queue.delete(a.user.id);
    this.#queue.delete(b.user.id);

    const serverTime = this.#clock.now();

    const duel = {
      id: crypto.randomUUID(),
      seed: randomSeed(),
      language: DUEL_LANGUAGE,
      wordListVersion: currentWordListVersion[DUEL_LANGUAGE],
      seconds: DUEL_SECONDS,
      startsAt: serverTime + COUNTDOWN_MS,
    } as const;

    const running = new RunningDuel({ mode: "time", ...duel }, duel.startsAt, [
      a.user.id,
      b.user.id,
    ]);

    this.#duels.set(a.user.id, running);
    this.#duels.set(b.user.id, running);
    this.#clock.at(running.endsAt, () => this.#end(running));

    a.connection.send({ type: "duel-found", duel, opponent: opponentOf(b.user), serverTime });
    b.connection.send({ type: "duel-found", duel, opponent: opponentOf(a.user), serverTime });
  }
}

const opponentOf = ({ name, image }: User) => ({ name, image });
