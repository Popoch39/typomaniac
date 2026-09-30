// The Stats' bento, and its Skeleton's: the rest of the window's height, whatever the page left (no
// height of its own, a 0 px basis), 30.25rem at least, what a 720 px window leaves under the
// header; below, the page scrolls. Two columns for the wpm tile, one each for the win rate and the
// accuracy, the Records under those two.
export const PROFILE_BENTO_PAINT =
  "grid min-h-[30.25rem] flex-[1_1_0px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4";

// A tile of the bento: a card whose own size its figures follow (container units), the grid giving
// it that size.
export const PROFILE_TILE_PAINT = "rounded-card bg-card [container-type:size]";

// The name atop each tile of the Profile's Stats: small and quiet, the figure under it speaks.
export const PROFILE_CARD_LABEL_PAINT = "text-[15px] font-semibold text-muted-foreground";

// The colour of the wins, the Draws and the losses, in the win rate's bar as in its legend.
export const OUTCOME_PAINT = {
  wins: "bg-primary",
  draws: "bg-muted-foreground",
  losses: "bg-surface-2",
} as const;

export type Outcome = keyof typeof OUTCOME_PAINT;
