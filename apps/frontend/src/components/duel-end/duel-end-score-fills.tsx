// Where the slant stands, in % of the band's width: `--share`, this User's share of both Scores,
// reached from `--share-from` (the middle, or the HUD's split when the band comes from it) as the
// entrance moves `--share-in` from 0 to 1 (1 once it is gone).
const SLANT =
  "(var(--share-from, 50) + (var(--share) - var(--share-from, 50)) * var(--share-in, 1))";

// A point on the slant, `lean` points to the side of it, as a length of the band's width.
const at = (lean: number) => `calc((${SLANT} + ${lean}) * 1%)`;

// This User's fill, up to the slant, and the seam in the ground's colour along it: the slant leans
// 5 points each side of its place.
const OWN_CLIP = {
  clipPath: `polygon(0 0, ${at(5)} 0, ${at(-5)} 100%, 0 100%)`,
};

const SEAM_CLIP = {
  clipPath: `polygon(${at(4.6)} 0, ${at(5.4)} 0, ${at(-4.6)} 100%, ${at(-5.4)} 100%)`,
};

// Under the band's figures: the accent on this User's side, the opponent's colour showing past it.
export const DuelEndScoreFills = () => (
  <>
    <div aria-hidden="true" style={OWN_CLIP} className="absolute inset-0 bg-brand" />
    <div aria-hidden="true" style={SEAM_CLIP} className="absolute inset-0 bg-background" />
  </>
);
