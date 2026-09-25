import {
  acceptKeystroke,
  type AcceptedRun,
  computeResult,
  computeScore,
  duelOutcome,
  type DuelSide,
  type Keystroke,
  type Outcome,
  type Result,
  type RunConfig,
  startAcceptedRun,
} from "typing-engine";

import { type RankedOutcome, type Rating, rateDuel } from "ranked";

import type { Duel, DuelScore, Form, ServerMessage } from "./model";
import type { DuelPlayerRecord, DuelRecord, RatedPlayer } from "./store";

// How late past the end a Keystroke may still arrive: the network delay of the last ones.
export const END_TOLERANCE_MS = 1000;

// More Keystrokes than this within a second is no human's cadence: a Forfeit.
const MAX_KEYSTROKES_PER_SECOND = 40;

// A User as the Duel sees them: who they are and what the opponent is shown, read when they joined
// the Queue. Only a User with a Handle plays.
export type User = { id: string; handle: string; image: string | null };

// A User paired into a Duel, with their Pace in wpm and their Form, both frozen for it, and their
// Rating when the Duel is ranked (from the Queue): null for a Challenge, never ranked.
export type PacedUser = { user: User; pace: number; form: Form | null; rating: Rating | null };

export type DuelEnded = Extract<ServerMessage, { type: "duel-ended" }>;

// The end of the Duel as one player is told it, but for the id it is written under: known once
// the write is done.
export type Ending = { userId: string; message: Omit<DuelEnded, "duelId"> };

// The end of the Duel: as each player is told it, and as it is written.
export type Finish = { endings: Ending[]; record: DuelRecord };

// The outcome of the Duel for each player, from the engine's.
const OUTCOMES = {
  first: ["win", "loss"],
  second: ["loss", "win"],
  draw: ["draw", "draw"],
} as const;

// What a player's opponent is shown of them.
const profileOf = ({ handle, image }: User) => ({ handle, image });

type Player = PacedUser & {
  acceptedRun: AcceptedRun;
  // Every Keystroke received from the player, accepted or not.
  received: number;
};

// A player at the end of the Duel: their Result and their Score.
type Side = { result: Result; score: DuelScore };

// What the engine's duelOutcome judges of a side: the points of its Score.
const judgedSide = ({ result, score }: Side): DuelSide => ({ result, score: score.score });

// A player as the finished Duel is written: the Keystrokes that replay to their Result and Score.
const playerRecord = (
  { user, pace, acceptedRun }: Player,
  { result, score }: Side,
  rated: RatedPlayer | null,
): DuelPlayerRecord => ({
  userId: user.id,
  result,
  pace,
  score,
  keystrokes: [...acceptedRun.keystrokes],
  rated,
});

const ratePlayer = (before: Rating, opponent: Rating, outcome: RankedOutcome): RatedPlayer => {
  const { rating, tp } = rateDuel(before, opponent.mmr, outcome);

  return { before, after: rating, tp };
};

// What the Duel does to both Ratings, each judged against the other's MMR before it; null unless
// both players have one (a Duel of the Queue).
const rate = (
  [first, second]: readonly [Player, Player],
  [firstOutcome, secondOutcome]: readonly [RankedOutcome, RankedOutcome],
): [RatedPlayer, RatedPlayer] | [null, null] => {
  if (!first.rating || !second.rating) {
    return [null, null];
  }

  return [
    ratePlayer(first.rating, second.rating, firstOutcome),
    ratePlayer(second.rating, first.rating, secondOutcome),
  ];
};

// What a player is told of their rank: never the MMR.
const rankedOf = (rated: RatedPlayer | null): DuelEnded["ranked"] =>
  rated && { tp: rated.tp, previousRank: rated.before.rank, rank: rated.after.rank };

// What became of a batch of Keystrokes: the accepted ones, to relay, whether any was rejected, and
// whether the player typed at an inhuman rate.
type Batch = { accepted: Keystroke[]; rejected: boolean; flooded: boolean };

// The last accepted Keystrokes are too close together: more than the cadence allows in a second.
const isFlooding = ({ keystrokes }: AcceptedRun) => {
  const last = keystrokes.at(-1);
  const first = keystrokes.at(-1 - MAX_KEYSTROKES_PER_SECOND);

  return typeof last !== "undefined" && typeof first !== "undefined" && last.at - first.at < 1000;
};

// A Duel between its Countdown and its end: the server judges each player's Keystrokes with the
// engine and only keeps those whose date is plausible (ADR 0003).
export class RunningDuel {
  readonly duel: Duel;

  readonly #config: RunConfig & { mode: "time" };

  readonly #players: readonly [Player, Player];

  constructor(duel: Duel, users: readonly [PacedUser, PacedUser]) {
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

  #newPlayer(paced: PacedUser): Player {
    return { ...paced, acceptedRun: startAcceptedRun(this.#config), received: 0 };
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

  // A player's Result and Score over the whole time of the Duel, even when it ends by a Forfeit.
  // Their Bursts are judged against their own Pace.
  #sideOf({ acceptedRun, pace }: Player): Side {
    const result = computeResult(this.#config, acceptedRun.keystrokes, this.#durationMs);

    const { score, bestCombo, bursts } = computeScore(
      this.#config,
      acceptedRun.keystrokes,
      pace,
      this.#durationMs,
    );

    return { result, score: { score, bestCombo, bursts } };
  }

  // The end at `endedAt`, in ms since the epoch: both players see the same two Results and Scores.
  // `outcomeOf` judges them as the engine's duelOutcome does, first player against second.
  #finish(
    endedAt: number,
    forfeit: boolean,
    outcomeOf: (first: DuelSide, second: DuelSide) => Outcome,
  ): Finish {
    const [first, second] = this.#players;
    const firstSide = this.#sideOf(first);
    const secondSide = this.#sideOf(second);
    const judged = outcomeOf(judgedSide(firstSide), judgedSide(secondSide));
    const [firstOutcome, secondOutcome] = OUTCOMES[judged];
    const [firstRated, secondRated] = rate(this.#players, OUTCOMES[judged]);

    const endingFor = (
      player: Player,
      opponent: Player,
      outcome: DuelEnded["outcome"],
      [side, opponentSide]: [Side, Side],
      rated: RatedPlayer | null,
    ): Ending => ({
      userId: player.user.id,
      message: {
        type: "duel-ended",
        outcome,
        forfeit,
        result: side.result,
        opponentResult: opponentSide.result,
        score: side.score,
        opponentScore: opponentSide.score,
        opponent: profileOf(opponent.user),
        ranked: rankedOf(rated),
      },
    });

    const winner = { first, second, draw: null }[judged];

    return {
      endings: [
        endingFor(first, second, firstOutcome, [firstSide, secondSide], firstRated),
        endingFor(second, first, secondOutcome, [secondSide, firstSide], secondRated),
      ],
      record: {
        ...this.duel,
        mode: this.#config.mode,
        endedAt,
        outcome: forfeit ? "forfeit" : winner ? "win" : "draw",
        winnerId: winner?.user.id ?? null,
        players: [
          playerRecord(first, firstSide, firstRated),
          playerRecord(second, secondSide, secondRated),
        ],
      },
    };
  }

  // The end once the time is up: the best Score wins (duelOutcome of the engine). It ended when
  // its time ran out, not when the server stopped waiting for the last Keystrokes.
  end() {
    return this.#finish(this.duel.startsAt + this.#durationMs, false, duelOutcome);
  }

  // `loserId` forfeits: the opponent wins, whatever the Scores so far.
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
      const acceptance = acceptKeystroke(player.acceptedRun, keystroke, window);

      player.received += 1;

      if (acceptance.accepted) {
        player.acceptedRun = acceptance.acceptedRun;
        batch.accepted.push(keystroke);
      } else {
        batch.rejected = true;
      }

      if (isFlooding(player.acceptedRun)) {
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
      keystrokes: [...player.acceptedRun.keystrokes],
      received: player.received,
      opponentKeystrokes: [...this.#opponent(userId).acceptedRun.keystrokes],
    };
  }

  // Who a player faces, as `duel-found` shows them.
  opponentProfileOf(userId: string) {
    return profileOf(this.#opponent(userId).user);
  }

  // A player's Pace, rank before the Duel (never the MMR) and Form, and the opponent's, as
  // `duel-found` and `duel-resumed` send them.
  pairingOf(userId: string) {
    const player = this.#player(userId);
    const opponent = this.#opponent(userId);

    return {
      pace: player.pace,
      opponentPace: opponent.pace,
      selfRank: player.rating?.rank ?? null,
      opponentRank: opponent.rating?.rank ?? null,
      selfForm: player.form,
      opponentForm: opponent.form,
    };
  }
}
