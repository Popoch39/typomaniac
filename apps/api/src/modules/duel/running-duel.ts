import {
  acceptKeystroke,
  type AcceptedRun,
  averageResult,
  computeResult,
  computeScore,
  duelOutcome,
  type Keystroke,
  type Outcome,
  type Result,
  type RoundSide,
  type RoundSides,
  roundsWon,
  type RunConfig,
  startAcceptedRun,
} from "typing-engine";

import { type RankedOutcome, type Rating, rateDuel, type Stake, stakeOf, type Tier } from "ranked";

import type { Duel, DuelScore, Form, Records, ServerMessage } from "./model";
import type { DuelPlayerRecord, DuelRecord, RatedPlayer, RoundRecord } from "./store";

// How many Rounds a player wins the Duel with: every Duel is a single Round so far.
const ROUNDS_TO_WIN = 1;

// How late past the end a Keystroke may still arrive: the network delay of the last ones. The
// client sends its batch every 50 ms and empties it at the end.
export const END_TOLERANCE_MS = 400;

// More Keystrokes than this within a second is no human's cadence: a Forfeit.
const MAX_KEYSTROKES_PER_SECOND = 40;

// A User as the Duel sees them: who they are and what the opponent is shown, read when they joined
// the Queue. Only a User with a Handle plays.
export type User = { id: string; handle: string; image: string | null };

// A User paired into a Duel, with their Pace in wpm, their Form, the Ornament they wear and their
// Records (null when unread), all frozen for it, and their Rating when the Duel is ranked (from the
// Queue): null for a Challenge, never ranked.
export type PacedUser = {
  user: User;
  pace: number;
  form: Form | null;
  ornament: Tier | null;
  records: Records | null;
  rating: Rating | null;
};

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
const profileOf = ({ handle, image }: User) => ({ handle, image });

type Player = PacedUser & {
  // The player's Run in the Round being played.
  acceptedRun: AcceptedRun;
  // Every Keystroke received from the player in the Round being played, accepted or not.
  received: number;
  // What a win and a loss would do to their TP, from the Ratings frozen at the pairing: exactly
  // what `rate` applies. Null unless the Duel is ranked, and in Placement.
  stake: Stake | null;
};

// A player's Stake against the other: only when both have a Rating, as `rate` requires.
const stakeAgainst = (player: PacedUser, opponent: PacedUser) =>
  player.rating && opponent.rating ? stakeOf(player.rating, opponent.rating.mmr) : null;

// A player at the end of a Round: their Result and their Score.
type Side = { result: Result; score: DuelScore };

// What the engine judges of a side: the points of its Score.
const judgedSide = ({ result, score }: Side): RoundSide => ({ result, score: score.score });

// A Round once played: as it is written, and both players' sides, the first player's first.
type EndedRound = { record: RoundRecord; sides: readonly [Side, Side] };

// Both sides of a Round as the engine judges them.
const judgedRound = ({ sides: [first, second] }: EndedRound): RoundSides => [
  judgedSide(first),
  judgedSide(second),
];

// A player as a Round is written: the Keystrokes that replay to their Result and Score.
const roundPlayerOf = ({ user, acceptedRun }: Player, { result, score }: Side) => ({
  userId: user.id,
  result,
  score,
  keystrokes: [...acceptedRun.keystrokes],
});

// The Round being played: its index from 0, its Text and its start, in ms since the epoch.
type CurrentRound = { index: number; config: RunConfig & { mode: "time" }; startsAt: number };

// A player as the finished Duel is written: their Result over its Rounds and the Rounds they won.
const playerRecord = (
  { user, pace }: Player,
  result: Result,
  won: number,
  rated: RatedPlayer | null,
): DuelPlayerRecord => ({ userId: user.id, result, pace, roundsWon: won, rated });

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

  readonly #players: readonly [Player, Player];

  // The Round being played: the first one starts with the Duel, on its Seed.
  readonly #round: CurrentRound;

  // The Rounds played so far, the first first.
  readonly #played: EndedRound[] = [];

  constructor(duel: Duel, users: readonly [PacedUser, PacedUser]) {
    this.duel = duel;
    this.#round = {
      index: 0,
      config: {
        mode: "time",
        seconds: duel.seconds,
        language: duel.language,
        wordListVersion: duel.wordListVersion,
        seed: duel.seed,
      },
      startsAt: duel.startsAt,
    };

    const [first, second] = users;

    this.#players = [this.#newPlayer(first, second), this.#newPlayer(second, first)];
  }

  #newPlayer(paced: PacedUser, opponent: PacedUser): Player {
    return {
      ...paced,
      acceptedRun: startAcceptedRun(this.#round.config),
      received: 0,
      stake: stakeAgainst(paced, opponent),
    };
  }

  get #durationMs() {
    return this.duel.seconds * 1000;
  }

  // When the server ends the Round being played: once its time is up and the last Keystrokes had
  // the time to arrive. In ms since the epoch.
  get endsAt() {
    return this.#round.startsAt + this.#durationMs + END_TOLERANCE_MS;
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

  // A player's Result and Score over the whole time of the Round being played, even when a Forfeit
  // cuts it short. Their Bursts are judged against their own Pace.
  #sideOf({ acceptedRun, pace }: Player): Side {
    const { config } = this.#round;
    const result = computeResult(config, acceptedRun.keystrokes, this.#durationMs);

    const { score, bestCombo, bursts } = computeScore(
      config,
      acceptedRun.keystrokes,
      pace,
      this.#durationMs,
    );

    return { result, score: { score, bestCombo, bursts } };
  }

  // The Round being played, ended at `endedAt` (ms since the epoch): both players' sides, judged
  // the same for both.
  #endRound(endedAt: number): EndedRound {
    const [first, second] = this.#players;
    const firstSide = this.#sideOf(first);
    const secondSide = this.#sideOf(second);

    return {
      record: {
        index: this.#round.index,
        seed: this.#round.config.seed,
        startsAt: this.#round.startsAt,
        endedAt,
        players: [roundPlayerOf(first, firstSide), roundPlayerOf(second, secondSide)],
      },
      sides: [firstSide, secondSide],
    };
  }

  // The end at `endedAt` (ms since the epoch) after the Rounds `played`, the first first, and the
  // Round a Forfeit cut short, if any: it counts for nobody. Both players see the same Results
  // and Scores. `judged` is the outcome, first player against second.
  #finish(
    endedAt: number,
    played: readonly EndedRound[],
    cutShort: EndedRound | null,
    judged: Outcome,
  ): Finish {
    const [first, second] = this.#players;
    const [firstRound, ...laterRounds] = cutShort ? [...played, cutShort] : played;

    // `end` and `forfeit` always end a Round first.
    if (!firstRound) {
      throw new Error(`Duel ${this.duel.id} ended before its first Round`);
    }

    const last = laterRounds.at(-1) ?? firstRound;
    const won = roundsWon(played.map(judgedRound));
    const forfeit = cutShort !== null;
    const [firstOutcome, secondOutcome] = OUTCOMES[judged];
    const [firstRated, secondRated] = rate(this.#players, OUTCOMES[judged]);

    // A player's Result over the Rounds, and their Score in the last one.
    const sideOver = (seat: 0 | 1): Side => ({
      result: averageResult([
        firstRound.sides[seat].result,
        ...laterRounds.map(({ sides }) => sides[seat].result),
      ]),
      score: last.sides[seat].score,
    });

    const firstSide = sideOver(0);
    const secondSide = sideOver(1);

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
        duelId: this.duel.id,
        outcome,
        forfeit,
        result: side.result,
        opponentResult: opponentSide.result,
        score: side.score,
        opponentScore: opponentSide.score,
        opponent: profileOf(opponent.user),
        ranked: rankedOf(rated),
        records: player.records,
      },
    });

    const winner = { first, second, draw: null }[judged];
    const { seed: _, ...duel } = this.duel;

    return {
      endings: [
        endingFor(first, second, firstOutcome, [firstSide, secondSide], firstRated),
        endingFor(second, first, secondOutcome, [secondSide, firstSide], secondRated),
      ],
      record: {
        ...duel,
        mode: this.#round.config.mode,
        endedAt,
        outcome: forfeit ? "forfeit" : winner ? "win" : "draw",
        winnerId: winner?.user.id ?? null,
        roundsToWin: ROUNDS_TO_WIN,
        players: [
          playerRecord(first, firstSide.result, won[0], firstRated),
          playerRecord(second, secondSide.result, won[1], secondRated),
        ],
        rounds: [firstRound.record, ...laterRounds.map(({ record }) => record)],
      },
    };
  }

  // The end once the time of the Round is up: it ended when its time ran out, not when the server
  // stopped waiting for the last Keystrokes. The Duel goes as its Rounds (duelOutcome of the
  // engine): the most Rounds won, then the cumulated Score, then the average accuracy.
  end() {
    const endedAt = this.#round.startsAt + this.#durationMs;

    this.#played.push(this.#endRound(endedAt));

    return this.#finish(endedAt, this.#played, null, duelOutcome(this.#played.map(judgedRound)));
  }

  // `loserId` forfeits: the opponent wins the Duel, whatever its Rounds and Scores so far. The
  // Round being played ends there.
  forfeit(loserId: string, now: number) {
    const [first] = this.#players;

    return this.#finish(
      now,
      this.#played,
      this.#endRound(now),
      first.user.id === loserId ? "second" : "first",
    );
  }

  // Judges each Keystroke of a batch on its arrival, `now` on the server's clock.
  receive(userId: string, keystrokes: readonly Keystroke[], now: number): Batch {
    const player = this.#player(userId);
    const batch: Batch = { accepted: [], rejected: false, flooded: false };

    const window = {
      arrivedAt: now - this.#round.startsAt,
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

  // Who a player faces, as `duel-found` shows them: with the Ornament they wear.
  opponentProfileOf(userId: string) {
    const opponent = this.#opponent(userId);

    return { ...profileOf(opponent.user), ornament: opponent.ornament };
  }

  // A player's Ornament, then their Pace, rank before the Duel (never the MMR) and Form, and the
  // opponent's, then the player's own Stake, as `duel-found` and `duel-resumed` send them.
  pairingOf(userId: string) {
    const player = this.#player(userId);
    const opponent = this.#opponent(userId);

    return {
      selfOrnament: player.ornament,
      pace: player.pace,
      opponentPace: opponent.pace,
      selfRank: player.rating?.rank ?? null,
      opponentRank: opponent.rating?.rank ?? null,
      selfForm: player.form,
      opponentForm: opponent.form,
      selfStake: player.stake,
    };
  }
}
