import {
  acceptKeystroke,
  type Keystroke,
  type Replay,
  type RunConfig,
  startReplay,
} from "typing-engine";

// How late past the end a Keystroke may still arrive: the network delay of the last ones.
export const END_TOLERANCE_MS = 1000;

type Player = {
  replay: Replay;
  // Every Keystroke received from the player, accepted or not.
  received: number;
};

// What became of a batch of Keystrokes: the accepted ones, to relay, and whether any was rejected.
type Batch = { accepted: Keystroke[]; rejected: boolean };

// A Duel between its Countdown and its end: the server replays each player's Keystrokes with the
// engine and only keeps those whose date is plausible (ADR 0003).
export class RunningDuel {
  readonly #config: RunConfig & { mode: "time" };

  // In ms since the epoch, on the server's clock.
  readonly #startsAt: number;

  readonly #userIds: readonly [string, string];

  readonly #players: Map<string, Player>;

  constructor(config: RunConfig & { mode: "time" }, startsAt: number, userIds: [string, string]) {
    this.#config = config;
    this.#startsAt = startsAt;
    this.#userIds = userIds;
    this.#players = new Map(
      userIds.map((id) => [id, { replay: startReplay(config), received: 0 }]),
    );
  }

  get #durationMs() {
    return this.#config.seconds * 1000;
  }

  // Once over, the players are free to join the Queue again.
  isOver(now: number) {
    return now - this.#startsAt >= this.#durationMs;
  }

  // `userId` is one of the two players.
  opponentOf(userId: string) {
    const [first, second] = this.#userIds;

    return userId === first ? second : first;
  }

  #keystrokesOf(userId: string) {
    return [...(this.#players.get(userId)?.replay.keystrokes ?? [])];
  }

  // Judges each Keystroke of a batch on its arrival, `now` on the server's clock.
  receive(userId: string, keystrokes: readonly Keystroke[], now: number): Batch {
    const player = this.#players.get(userId);
    const batch: Batch = { accepted: [], rejected: false };

    if (!player) {
      return batch;
    }

    const window = {
      arrivedAt: now - this.#startsAt,
      endsAt: this.#durationMs,
      tolerance: END_TOLERANCE_MS,
    };

    for (const keystroke of keystrokes) {
      const acceptance = acceptKeystroke(player.replay, keystroke, window);

      player.received += 1;

      if (acceptance.accepted) {
        player.replay = acceptance.replay;
        batch.accepted.push(keystroke);
      } else {
        batch.rejected = true;
      }
    }

    return batch;
  }

  // The state that holds for a player: what a resync sends them.
  stateOf(userId: string) {
    return {
      keystrokes: this.#keystrokesOf(userId),
      received: this.#players.get(userId)?.received ?? 0,
      opponentKeystrokes: this.#keystrokesOf(this.opponentOf(userId)),
    };
  }
}
