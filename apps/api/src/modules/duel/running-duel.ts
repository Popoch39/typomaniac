import {
  acceptKeystroke,
  type AcceptedRun,
  averageResult,
  computeResult,
  computeScore,
  duelOutcome,
  isDuelDecided,
  type Keystroke,
  type Outcome,
  type Result,
  roundOutcome,
  type RoundSide,
  type RoundSides,
  roundsWon,
  type RunConfig,
  startAcceptedRun,
} from "typing-engine";

import { type RankedOutcome, type Rating, rateDuel, type Stake, stakeOf, type Tier } from "ranked";

import type {
  Duel,
  DuelScore,
  Form,
  PlayedRound,
  Records,
  RoundStart,
  ServerMessage,
} from "./model";
import type { DuelPlayerRecord, DuelRecord, RatedPlayer, RoundRecord } from "./store";

// How late past the end a Keystroke may still arrive: the network delay of the last ones. The
// client sends its batch every 50 ms and empties it at the end.
export const END_TOLERANCE_MS = 400;

// Between the server's judgement of a Round and the start of the next one: the Round break.
export const ROUND_BREAK_MS = 7000;

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

type RoundEnded = Extract<ServerMessage, { type: "round-ended" }>;

// The end of the Duel as one player is told it.
export type Ending = { userId: string; message: DuelEnded };

// The end of the Duel: as each player is told it, and as it is written.
export type Finish = { endings: Ending[]; record: DuelRecord };

// The end of a Round: the next one, as each player is told it, or the end of the Duel it decided.
export type RoundEnd =
  | { kind: "next"; announcements: { userId: string; message: RoundEnded }[] }
  | { kind: "finished"; finish: Finish };

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

// A player's seat in the Duel: the first player's sides come first.
type Seat = 0 | 1;

const otherSeat = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

// A Round as the player at `seat` sees it: their outcome, and their side first.
const playedRoundFor = (round: EndedRound, seat: Seat): PlayedRound => {
  const mine = round.sides[seat];
  const theirs = round.sides[otherSeat(seat)];

  return {
    index: round.record.index,
    outcome: OUTCOMES[roundOutcome(...judgedRound(round))][seat],
    result: mine.result,
    opponentResult: theirs.result,
    score: mine.score,
    opponentScore: theirs.score,
  };
};

// The Rounds `played` as the player at `seat` sees them, and the Rounds each won: a drawn Round,
// and those in `uncounted` (cut short by a Forfeit), count for nobody.
const roundsSoFarFor = (
  seat: Seat,
  played: readonly EndedRound[],
  uncounted: readonly EndedRound[] = [],
) => {
  const won = roundsWon(played.map(judgedRound));

  return {
    rounds: [...played, ...uncounted].map((round) => playedRoundFor(round, seat)),
    roundsWon: won[seat],
    opponentRoundsWon: won[otherSeat(seat)],
  };
};

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

// A Duel between its Countdown and its end, Round after Round: the server judges each player's
// Keystrokes with the engine and only keeps those whose date is plausible (ADR 0003). It plays its
// Rounds until a player won `roundsToWin` of them, or the last one it plays is over.
export class RunningDuel {
  readonly duel: Duel;

  readonly #players: readonly [Player, Player];

  // The Round being played, or during a Round break the next one: the first one starts with the
  // Duel, on its Seed.
  #round: CurrentRound;

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

  // The index of the Round being played, or of the next one during a Round break.
  get roundIndex() {
    return this.#round.index;
  }

  get userIds() {
    return this.#players.map((player) => player.user.id);
  }

  #seatOf(userId: string): Seat {
    return this.#players[0].user.id === userId ? 0 : 1;
  }

  #player(userId: string) {
    return this.#players[this.#seatOf(userId)];
  }

  // `userId` is one of the two players.
  #opponent(userId: string) {
    return this.#players[otherSeat(this.#seatOf(userId))];
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

  // The end at `endedAt` (ms since the epoch) after the Rounds played, the first first, and on a
  // Forfeit the Round it cut short, if one was being played: it counts for nobody. Both players see
  // the same Results and Scores. `judged` is the outcome, first player against second.
  #finish(
    endedAt: number,
    judged: Outcome,
    { forfeit, cutShort }: { forfeit: boolean; cutShort: EndedRound | null },
  ): Finish {
    const [first, second] = this.#players;
    const played = this.#played;
    const uncounted = cutShort ? [cutShort] : [];
    const [firstRound, ...laterRounds] = [...played, ...uncounted];

    // `end` and `forfeit` always end a Round first.
    if (!firstRound) {
      throw new Error(`Duel ${this.duel.id} ended before its first Round`);
    }

    const last = laterRounds.at(-1) ?? firstRound;
    const won = roundsWon(played.map(judgedRound));
    const [firstOutcome, secondOutcome] = OUTCOMES[judged];
    const [firstRated, secondRated] = rate(this.#players, OUTCOMES[judged]);

    // A player's Result over the Rounds, and their Score in the last one.
    const sideOver = (seat: Seat): Side => ({
      result: averageResult([
        firstRound.sides[seat].result,
        ...laterRounds.map(({ sides }) => sides[seat].result),
      ]),
      score: last.sides[seat].score,
    });

    const firstSide = sideOver(0);
    const secondSide = sideOver(1);

    const endingFor = (
      seat: Seat,
      outcome: DuelEnded["outcome"],
      [side, opponentSide]: [Side, Side],
      rated: RatedPlayer | null,
    ): Ending => {
      const player = this.#players[seat];

      return {
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
          roundsToWin: this.duel.roundsToWin,
          ...roundsSoFarFor(seat, played, uncounted),
          opponent: profileOf(this.#players[otherSeat(seat)].user),
          ranked: rankedOf(rated),
          records: player.records,
        },
      };
    };

    const winner = { first, second, draw: null }[judged];
    const { seed: _, ...duel } = this.duel;

    return {
      endings: [
        endingFor(0, firstOutcome, [firstSide, secondSide], firstRated),
        endingFor(1, secondOutcome, [secondSide, firstSide], secondRated),
      ],
      record: {
        ...duel,
        mode: this.#round.config.mode,
        endedAt,
        outcome: forfeit ? "forfeit" : winner ? "win" : "draw",
        winnerId: winner?.user.id ?? null,
        players: [
          playerRecord(first, firstSide.result, won[0], firstRated),
          playerRecord(second, secondSide.result, won[1], secondRated),
        ],
        rounds: [firstRound.record, ...laterRounds.map(({ record }) => record)],
      },
    };
  }

  // A Seed for the next Round, drawn by `draw` until it is none of the Duel's so far: each Round
  // has its own Text.
  #nextSeed(draw: () => number) {
    const used = new Set([
      ...this.#played.map(({ record }) => record.seed),
      this.#round.config.seed,
    ]);

    let seed = draw();

    while (used.has(seed)) {
      seed = draw();
    }

    return seed;
  }

  // The end once the time of the Round is up, judged at `judgedAt` (ms since the epoch): the Round
  // ended when its time ran out, not when the server stopped waiting for the last Keystrokes. A
  // decided Duel ends there, as its Rounds go (duelOutcome of the engine: the most Rounds won, then
  // the cumulated Score, then the average accuracy). Otherwise the next Round, on a new Seed from
  // `draw`, starts ROUND_BREAK_MS after the judgement, each player's Run and Combo from zero.
  endRound(judgedAt: number, draw: () => number): RoundEnd {
    const endedAt = this.#round.startsAt + this.#durationMs;
    const ended = this.#endRound(endedAt);

    this.#played.push(ended);

    const judged = this.#played.map(judgedRound);

    if (isDuelDecided(judged, this.duel.roundsToWin)) {
      return {
        kind: "finished",
        finish: this.#finish(endedAt, duelOutcome(judged), { forfeit: false, cutShort: null }),
      };
    }

    this.#round = {
      index: this.#round.index + 1,
      config: { ...this.#round.config, seed: this.#nextSeed(draw) },
      startsAt: judgedAt + ROUND_BREAK_MS,
    };

    for (const player of this.#players) {
      player.acceptedRun = startAcceptedRun(this.#round.config);
      player.received = 0;
    }

    const next = this.#roundStart();

    return {
      kind: "next",
      announcements: this.#players.map((player) => {
        const seat = this.#seatOf(player.user.id);
        const { roundsWon: won, opponentRoundsWon } = roundsSoFarFor(seat, this.#played);

        return {
          userId: player.user.id,
          message: {
            type: "round-ended",
            round: playedRoundFor(ended, seat),
            roundsWon: won,
            opponentRoundsWon,
            next,
            serverTime: judgedAt,
          },
        };
      }),
    };
  }

  // `loserId` forfeits at `now`: the opponent wins the Duel, whatever its Rounds and Scores so far.
  // The Round being played ends there; during a Round break, no Round is: the next one is never
  // played.
  forfeit(loserId: string, now: number) {
    const [first] = this.#players;
    const between = this.#played.length > 0 && now < this.#round.startsAt;

    return this.#finish(now, first.user.id === loserId ? "second" : "first", {
      forfeit: true,
      cutShort: between ? null : this.#endRound(now),
    });
  }

  // Judges each Keystroke of a batch on its arrival, `now` on the server's clock, against the Round
  // being played: during a Round break, every Keystroke arrives before the next one starts.
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

  // The Round being played, or the next one during a Round break.
  #roundStart(): RoundStart {
    return {
      index: this.#round.index,
      seed: this.#round.config.seed,
      startsAt: this.#round.startsAt,
    };
  }

  // The state that holds for a player in the Round being played: what a resync sends them.
  stateOf(userId: string) {
    const player = this.#player(userId);

    return {
      keystrokes: [...player.acceptedRun.keystrokes],
      received: player.received,
      opponentKeystrokes: [...this.#opponent(userId).acceptedRun.keystrokes],
    };
  }

  // Where the Duel stands for a player coming back to it: the Rounds played, the Round being
  // played (or the next one) and its state, as `duel-resumed` sends them.
  resumeOf(userId: string) {
    return {
      ...roundsSoFarFor(this.#seatOf(userId), this.#played),
      round: this.#roundStart(),
      ...this.stateOf(userId),
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
