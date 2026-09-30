// This User's fill, up to the slant, and the seam in the ground's colour along it: the slant leans
// 5 points each side of `--share`, this User's share of both Scores in % of the band's width.
const OWN_CLIP = {
  clipPath:
    "polygon(0 0, calc((var(--share) + 5) * 1%) 0, calc((var(--share) - 5) * 1%) 100%, 0 100%)",
};

const SEAM_CLIP = {
  clipPath:
    "polygon(calc((var(--share) + 4.6) * 1%) 0, calc((var(--share) + 5.4) * 1%) 0, calc((var(--share) - 4.6) * 1%) 100%, calc((var(--share) - 5.4) * 1%) 100%)",
};

// Under the band's figures: the accent on this User's side, the opponent's colour showing past it.
export const DuelEndScoreFills = () => (
  <>
    <div aria-hidden="true" style={OWN_CLIP} className="absolute inset-0 bg-brand" />
    <div aria-hidden="true" style={SEAM_CLIP} className="absolute inset-0 bg-background" />
  </>
);
