import { type Stake, type StakeOutcome, type Standing, stepOf } from "ranked";

import { rankLabel } from "@/components/tier/rank-label";
import { standingName } from "@/components/tier/tier";

// The rank a win would move this User up to, a Division or a Tier: null when it keeps their
// Division.
const stakePromotion = (standing: Standing, stake: Stake) =>
  stepOf(stake.win.standing) > stepOf(standing) ? stake.win.standing : null;

// What a loss would do to the rank, after its TP: nothing to say but its TP in an ordinary Duel.
// Only words, never a warning: a loss that moves down reads like any other.
const lossCopy = (standing: Standing, loss: StakeOutcome, promotion: Standing | null) => {
  if (stepOf(loss.standing) < stepOf(standing)) {
    return ` → ${rankLabel(loss.standing)}`;
  }

  // Below 0 TP, the shield of a move up keeps the Division, and nothing lies below Fer IV.
  if (standing.tp + loss.tp < 0) {
    return standing.shielded
      ? `, protégé : tu restes ${standingName(standing)}`
      : `, tu restes ${rankLabel(loss.standing)}`;
  }

  return promotion === null ? "" : `, tu restes ${standingName(standing)}`;
};

export type StakeCopy = { promotion: Standing | null; win: string; loss: string };

// The words of this User's Stake, after each outcome's TP: the rank a win would move up to (null
// when it keeps the Division), where a win leads, and what a loss would do to the rank.
export const stakeCopy = (standing: Standing, stake: Stake): StakeCopy => {
  const promotion = stakePromotion(standing, stake);

  return {
    promotion,
    win: ` → ${rankLabel(stake.win.standing)}`,
    loss: lossCopy(standing, stake.loss, promotion),
  };
};
