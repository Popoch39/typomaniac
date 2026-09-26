// Every constant below is a default chosen before any real data: tune them once Duels are played.

const DIVISION_TIERS = ["fer", "bronze", "argent", "or", "platine", "diamant"] as const;

export const TIERS = [...DIVISION_TIERS, "maniac"] as const;

export type Tier = (typeof TIERS)[number];

// IV is the lowest Division of a Tier, I the highest. Maniac has none.
export const DIVISIONS = [4, 3, 2, 1] as const;

export type Division = (typeof DIVISIONS)[number];

// A User's visible rank once Placement is over. `shielded`: just moved up, so the next loss, if it
// goes below 0 TP, keeps the Division. Any loss spends it.
export type Standing =
  | { tier: (typeof DIVISION_TIERS)[number]; division: Division; tp: number; shielded: boolean }
  | { tier: "maniac"; tp: number; shielded: boolean };

export type Placement = { placementsLeft: number };

export type Rank = Standing | Placement;

// How a Duel ended for one User: a Forfeit is a win for the opponent, a loss for the one who left.
export type RankedOutcome = "win" | "loss" | "draw";

export const PLACEMENT_DUELS = 5;

const SEED_MMR = 600;

// The default Pace of the engine, kept apart: the seed must not move if the Burst is retuned.
const SEED_PACE = 50;

const SEED_MMR_PER_WPM = 12;

const ELO_K = 32;

const PLACEMENT_ELO_K = 60;

// The MMR gap at which the stronger User is expected to win 10 times out of 11.
const ELO_SCALE = 400;

// The TP of a win or a loss between equal MMRs.
const BASE_TP = 20;

const MIN_TP = 8;

const MAX_TP = 35;

// TP gained or saved per MMR point above the MMR the displayed rank expects.
const CATCH_UP_TP_PER_MMR = 0.1;

const FER_IV_MMR = 400;

const MMR_PER_DIVISION = 50;

export const DIVISION_TP = 100;

const DEMOTED_TP = 75;

const DIVISIONS_PER_TIER = 4;

// The Divisions from Fer IV up, then Maniac as the last step.
const MANIAC_STEP = DIVISION_TIERS.length * DIVISIONS_PER_TIER;

const MATCH_WINDOW = 100;

const MATCH_WINDOW_STEP = 50;

const MATCH_WINDOW_STEP_MS = 5000;

const UNLIMITED_WINDOW_MS = 30_000;

const OUTCOME_SCORES: Record<RankedOutcome, number> = { win: 1, loss: 0, draw: 0.5 };

// The starting MMR of a User, from their Pace, so that their first Duels are not mismatched.
export const seedMmr = (pace: number) =>
  Math.round(SEED_MMR + (pace - SEED_PACE) * SEED_MMR_PER_WPM);

// The standard Elo expectation of `mmr` against `opponentMmr`, between 0 and 1.
export const expectedScore = (mmr: number, opponentMmr: number) =>
  1 / (1 + 10 ** ((opponentMmr - mmr) / ELO_SCALE));

export const nextMmr = (
  mmr: number,
  opponentMmr: number,
  outcome: RankedOutcome,
  inPlacement: boolean,
) =>
  Math.round(
    mmr +
      (inPlacement ? PLACEMENT_ELO_K : ELO_K) *
        (OUTCOME_SCORES[outcome] - expectedScore(mmr, opponentMmr)),
  );

// Fer IV is step 0, Diamant I step 23, Maniac step 24.
export const stepOf = (standing: Standing) =>
  standing.tier === "maniac"
    ? MANIAC_STEP
    : DIVISION_TIERS.indexOf(standing.tier) * DIVISIONS_PER_TIER +
      DIVISIONS_PER_TIER -
      standing.division;

// A move from one rank to another crosses a Tier, Maniac included: what makes a Promotion Duel.
export const changesTier = (from: Standing, to: Standing) => from.tier !== to.tier;

// The Ornament a User chooses to wear: their current Tier's, one Tier's frozen, or none.
export const ORNAMENT_CHOICES = ["follow", "none", ...TIERS] as const;

export type OrnamentChoice = (typeof ORNAMENT_CHOICES)[number];

// The Ornament a User wears: none in Placement, never one of a Tier above their own. Below the
// frozen Tier, they wear their current Tier's.
export const ornamentOf = (rank: Rank, choice: OrnamentChoice): Tier | null => {
  if (isPlacement(rank) || choice === "none") {
    return null;
  }

  if (choice === "follow" || TIERS.indexOf(choice) > TIERS.indexOf(rank.tier)) {
    return rank.tier;
  }

  return choice;
};

// The Ornaments a User may freeze: from Fer up to their current Tier, none in Placement.
export const wearableOrnaments = (rank: Rank): Tier[] =>
  isPlacement(rank) ? [] : TIERS.slice(0, TIERS.indexOf(rank.tier) + 1);

// Whether a User may choose `choice`: following their Tier or wearing none past Placement, a Tier
// only up to their own, nothing in Placement.
export const canWear = (rank: Rank, choice: OrnamentChoice) =>
  !isPlacement(rank) &&
  (choice === "follow" || choice === "none" || wearableOrnaments(rank).includes(choice));

// The Classement's order: the higher step first, then the more TP. Maniac is ordered by TP alone.
export const byStanding = (a: Standing, b: Standing) => stepOf(b) - stepOf(a) || b.tp - a.tp;

const standingAt = (step: number, tp: number, shielded: boolean): Standing => {
  if (step >= MANIAC_STEP) {
    return { tier: "maniac", tp, shielded };
  }

  return {
    tier: DIVISION_TIERS[Math.floor(step / DIVISIONS_PER_TIER)] ?? "fer",
    // SAFETY: step % 4 is 0 to 3, so the Division is 4 to 1.
    division: (DIVISIONS_PER_TIER - (step % DIVISIONS_PER_TIER)) as Division,
    tp,
    shielded,
  };
};

const expectedMmr = (standing: Standing) => FER_IV_MMR + stepOf(standing) * MMR_PER_DIVISION;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The TP a Duel moves: the Elo base, pushed toward the rank the MMR deserves, within 8 and 35. A
// Draw has no minimum: drawing an equal opponent moves nothing. A score of 1 against an expected
// 0.5 is a win at BASE_TP, hence the doubling.
export const tpDelta = (
  standing: Standing,
  mmr: number,
  opponentMmr: number,
  outcome: RankedOutcome,
) => {
  const base = 2 * BASE_TP * (OUTCOME_SCORES[outcome] - expectedScore(mmr, opponentMmr));
  const delta = Math.round(base + (mmr - expectedMmr(standing)) * CATCH_UP_TP_PER_MMR);

  if (outcome === "win") {
    return clamp(delta, MIN_TP, MAX_TP);
  }

  if (outcome === "loss") {
    return clamp(delta, -MAX_TP, -MIN_TP);
  }

  return clamp(delta, -MAX_TP, MAX_TP);
};

// The rank after a Duel's TP: up a Division at 100 with the surplus carried and a shield, down to
// the Division below at 75 when not shielded, never below Fer IV, and no cap in Maniac.
export const applyTp = (standing: Standing, delta: number): Standing => {
  const tp = standing.tp + delta;
  const step = stepOf(standing);

  if (step < MANIAC_STEP && tp >= DIVISION_TP) {
    return standingAt(step + 1, tp - DIVISION_TP, true);
  }

  if (tp >= 0) {
    return standingAt(step, tp, standing.shielded && delta >= 0);
  }

  if (standing.shielded || step === 0) {
    return standingAt(step, 0, false);
  }

  return standingAt(step - 1, DEMOTED_TP, false);
};

// The rank a User gets at the end of Placement: the Division whose expected MMR theirs reaches.
export const rankFromMmr = (mmr: number): Standing =>
  standingAt(clamp(Math.floor((mmr - FER_IV_MMR) / MMR_PER_DIVISION), 0, MANIAC_STEP), 0, false);

// The MMR gap the Queue accepts after `waitMs` of waiting: it widens so that everyone gets a Duel.
export const matchWindow = (waitMs: number) =>
  waitMs >= UNLIMITED_WINDOW_MS
    ? Infinity
    : MATCH_WINDOW + Math.floor(waitMs / MATCH_WINDOW_STEP_MS) * MATCH_WINDOW_STEP;

// The wait at which the window of `matchWindow` widens next, null once it is unlimited.
export const nextWidening = (waitMs: number) =>
  waitMs >= UNLIMITED_WINDOW_MS
    ? null
    : (Math.floor(waitMs / MATCH_WINDOW_STEP_MS) + 1) * MATCH_WINDOW_STEP_MS;

// How many recent pairings the Estimated wait is drawn from.
export const ESTIMATED_WAIT_PAIRINGS = 20;

// The Estimated wait: the median of the recent waits, never past the wait at which anyone is
// paired; null without any.
export const estimatedWait = (waitsMs: readonly number[]) => {
  const sorted = waitsMs.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const low = sorted[middle - 1];
  const high = sorted[middle];

  if (high === undefined) {
    return null;
  }

  const median = sorted.length % 2 === 0 && low !== undefined ? (low + high) / 2 : high;

  return Math.min(median, UNLIMITED_WINDOW_MS);
};

// A User's hidden MMR and visible rank, as a ranked Duel moves them.
export type Rating = { mmr: number; rank: Rank };

export const isPlacement = (rank: Rank): rank is Placement => "placementsLeft" in rank;

// What a ranked Duel did to one User: their new Rating and the TP it moved (null in Placement).
export type RatedDuel = { rating: Rating; tp: number | null };

// Where one outcome of a Duel leads a User past Placement: the TP it moves and their rank after it.
export type StakeOutcome = { tp: number; standing: Standing };

// The one path from an outcome to TP: rateDuel applies it, the Stake shows it beforehand.
const stakeOutcome = (
  standing: Standing,
  mmr: number,
  opponentMmr: number,
  outcome: RankedOutcome,
): StakeOutcome => {
  const tp = tpDelta(standing, mmr, opponentMmr, outcome);

  return { tp, standing: applyTp(standing, tp) };
};

// A ranked Duel for one User: their new MMR, and their new rank. In Placement, no TP moves (`tp`
// null) and the last Placement reveals the rank the MMR deserves.
export const rateDuel = (
  { mmr, rank }: Rating,
  opponentMmr: number,
  outcome: RankedOutcome,
): RatedDuel => {
  if (isPlacement(rank)) {
    const next = nextMmr(mmr, opponentMmr, outcome, true);
    const placementsLeft = rank.placementsLeft - 1;

    return {
      rating: { mmr: next, rank: placementsLeft > 0 ? { placementsLeft } : rankFromMmr(next) },
      tp: null,
    };
  }

  const { tp, standing } = stakeOutcome(rank, mmr, opponentMmr, outcome);

  return { rating: { mmr: nextMmr(mmr, opponentMmr, outcome, false), rank: standing }, tp };
};

// The Stake of a ranked Duel for one User, shown in the Face-off: what a win and a loss would do to
// their TP, by the same rules as rateDuel, so exactly what the Duel applies. Never a Draw, too rare
// to show. Null in Placement, where no TP moves.
export type Stake = { win: StakeOutcome; loss: StakeOutcome };

export const stakeOf = ({ mmr, rank }: Rating, opponentMmr: number): Stake | null =>
  isPlacement(rank)
    ? null
    : {
        win: stakeOutcome(rank, mmr, opponentMmr, "win"),
        loss: stakeOutcome(rank, mmr, opponentMmr, "loss"),
      };
