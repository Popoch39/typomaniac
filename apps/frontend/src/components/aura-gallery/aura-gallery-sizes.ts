// The avatar sizes of the app that wear an Ornament, the Ornament's box twice as large around
// each, from the Friends' 64 px up to the Face-off's 352 px. `full`: where the app shows the full
// Aura, or will.
export const AVATAR_SIZES = [
  { where: "Friends, Activity", avatar: "size-8", box: "size-16", full: false },
  { where: "Classement", avatar: "size-9", box: "size-18", full: false },
  // The header's `size="lg"` wins over its `size-9`: the attribute variant is more specific.
  { where: "Header", avatar: "size-10", box: "size-20", full: false },
  { where: "Profile", avatar: "size-16", box: "size-32", full: true },
  { where: "Match proposal, Queue", avatar: "size-21", box: "size-42", full: true },
  { where: "Face-off", avatar: "size-44", box: "size-88", full: true },
] as const;

// The Blason's boxes: the large Tier badge, then the Tier-up celebration, both shown full.
export const BLASON_SIZES = [
  { where: "Badge de Tier", box: "size-24" },
  { where: "Montée de Tier", box: "size-44" },
] as const;
