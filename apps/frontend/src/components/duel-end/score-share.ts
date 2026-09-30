// Where the band's slant sits, in % of its width: this User's share of both Scores, held between a
// quarter and three quarters so that neither side's name and Score are ever cut; in the middle at
// 0 to 0.
export const scoreShare = (score: number, opponentScore: number) => {
  const total = score + opponentScore;

  if (total === 0) {
    return 50;
  }

  return Math.min(75, Math.max(25, (score / total) * 100));
};
