import {
  acceptKeystroke,
  computeResult,
  duelOutcome,
  type Keystroke,
  type Outcome,
  type Replay,
  type Result,
  type RunConfig,
  startReplay,
} from "typing-engine";

import type { DuelPlayerRecord, DuelRecord } from "./duel-store";
import type { Duel, ServerMessage } from "./protocol";

// How late past the end a Keystroke may still arrive: the network delay of the last ones.
export const END_TOLERANCE_MS = 1000;

// More Keystrokes than this within a second is no human's cadence: a Forfeit.
const MAX_KEYSTROKES_PER_SECOND = 40;

// A User as the Duel sees them: who they are and what the opponent is shown.
export type User = { id: string; name: string; image: string | null };

export type DuelEnded = Extract<ServerMessage, { type: "duel-ended" }>;

// The end of the Duel as one player is told it.
export type Ending = { userId: string; message: DuelEnded };

// The end of the Duel: as each player is told it, and as it is written.
export type Finish = { endings: Ending[]; record: DuelRecord };

// The outcome of the Duel for each player, from the engine's.
const OUTCOMES = {
  first: ["win", "loss"],
  second: ["loss", "win"],
  draw: ["draw", "draw"],
} as const;

// What a player's opponent is shown of them.
const profileOf = ({ name, image }: User) => ({ name, image });

type Player = {
  user: User;
  replay: Replay;
  // Every Keystroke received from the player, accepted or not.
  received: number;
};

// A player as the finished Duel is written: the Keystrokes that replay to their Result.
const playerRecord = ({ user, replay }: Player, result: Result): DuelPlayerRecord => ({
  userId: user.id,
  result,
  keystrokes: [...replay.keystrokes],
});

// What became of a batch of Keystrokes: the accepted ones, to relay, whether any was rejected, and
// whether the player typed at an inhuman rate.
type Batch = { accepted: Keystroke[]; rejected: boolean; flooded: boolean };

// The last accepted Keystrokes are too close together: more than the cadence allows in a second.
const isFlooding = ({ keystrokes }: Replay) => {
  const last = keystrokes.at(-1);
  const first = keystrokes.at(-1 - MAX_KEYSTROKES_PER_SECOND);

  return typeof last !== "undefined" && typeof first !== "undefined" && last.at - first.at < 1000;
};

// A Duel between its Countdown and its end: the server replays each player's Keystrokes with the
// engine and only keeps those whose date is plausible (ADR 0003).
export class RunningDuel {
  readonly duel: Duel;

  readonly #config: RunConfig & { mode: "time" };

  readonly #players: readonly [Player, Player];

  constructor(duel: Duel, users: readonly [User, User]) {
    this.duel = duel;
    this.#config = {
      mode: "time",
      seconds: duel.seconds,
      language: duel.language,
      wordListVersion: duel.wordListVersion,
      seed: duel.seed,
    };

    const [first, second] = users;

    this.#players = [this.#newPlayer(first), this.#newPlayer(second)];
  }

  #newPlayer(user: User): Player {
    return { user, replay: startReplay(this.#config), received: 0 };
  }

  get #durationMs() {
    return this.#config.seconds * 1000;
  }

  // When the server ends the Duel: once the time is up and the last Keystrokes had the time to
  // arrive. In ms since the epoch.
  get endsAt() {
    return this.duel.startsAt + this.#durationMs + END_TOLERANCE_MS;
  }

  get userIds() {
    return this.#players.map((player) => player.user.id);
  }

  #player(userId: string) {
    const [first, second] = this.#players;

    return first.user.id === userId ? first : second;
  }

  // `userId` is one of the two players.
  #opponent(userId: string) {
    const [first, second] = this.#players;

    return first.user.id === userId ? second : first;
  }

  opponentOf(userId: string) {
    return this.#opponent(userId).user.id;
  }

  #resultOf({ replay }: Player) {
    return computeResult(this.#config, replay.keystrokes, this.#durationMs);
  }

  // The end at `endedAt`, in ms since the epoch: both players see the same two Results. `outcomeOf`
  // judges them as the engine's duelOutcome does, first player against second.
  #finish(
    endedAt: number,
    forfeit: boolean,
    outcomeOf: (first: Result, second: Result) => Outcome,
  ): Finish {
    const [first, second] = this.#players;
    const firstResult = this.#resultOf(first);
    const secondResult = this.#resultOf(second);
    const judged = outcomeOf(firstResult, secondResult);
    const [firstOutcome, secondOutcome] = OUTCOMES[judged];

    const endingFor = (
      player: Player,
      opponent: Player,
      outcome: DuelEnded["outcome"],
      [result, opponentResult]: [Result, Result],
    ): Ending => ({
      userId: player.user.id,
      message: {
        type: "duel-ended",
        outcome,
        forfeit,
        result,
        opponentResult,
        opponent: profileOf(opponent.user),
      },
    });

    const winner = { first, second, draw: null }[judged];

    return {
      endings: [
        endingFor(first, second, firstOutcome, [firstResult, secondResult]),
        endingFor(second, first, secondOutcome, [secondResult, firstResult]),
      ],
      record: {
        ...this.duel,
        mode: this.#config.mode,
        endedAt,
        outcome: forfeit ? "forfeit" : winner ? "win" : "draw",
        winnerId: winner?.user.id ?? null,
        players: [playerRecord(first, firstResult), playerRecord(second, secondResult)],
      },
    };
  }

  // The end once the time is up: the best Result wins (duelOutcome of the engine).
  end(now: number) {
    return this.#finish(now, false, duelOutcome);
  }

  // `loserId` forfeits: the opponent wins, whatever the Results so far.
  forfeit(loserId: string, now: number) {
    const [first] = this.#players;
    const winner = first.user.id === loserId ? "second" : "first";

    return this.#finish(now, true, () => winner);
  }

  // Judges each Keystroke of a batch on its arrival, `now` on the server's clock.
  receive(userId: string, keystrokes: readonly Keystroke[], now: number): Batch {
    const player = this.#player(userId);
    const batch: Batch = { accepted: [], rejected: false, flooded: false };

    const window = {
      arrivedAt: now - this.duel.startsAt,
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

      if (isFlooding(player.replay)) {
        batch.flooded = true;

        return batch;
      }
    }

    return batch;
  }

  // The state that holds for a player: what a resync sends them.
  stateOf(userId: string) {
    const player = this.#player(userId);

    return {
      keystrokes: [...player.replay.keystrokes],
      received: player.received,
      opponentKeystrokes: [...this.#opponent(userId).replay.keystrokes],
    };
  }

  // Who a player faces, as `duel-found` shows them.
  opponentProfileOf(userId: string) {
    return profileOf(this.#opponent(userId).user);
  }
}
