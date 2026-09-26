import { type Stake, type Standing, stepOf } from "ranked";

// The rank a win would move this User up to, a Division or a Tier: null when it keeps their
// Division.
export const stakePromotion = (standing: Standing, stake: Stake) =>
  stepOf(stake.win.standing) > stepOf(standing) ? stake.win.standing : null;
