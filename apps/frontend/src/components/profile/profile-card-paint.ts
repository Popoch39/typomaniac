// The name atop each card of the Profile's Stats: small and quiet, the figure under it speaks.
export const PROFILE_CARD_LABEL_PAINT = "text-[15px] font-semibold text-muted-foreground";

// The colour of the wins, the Draws and the losses, in the win rate's bar as in its legend.
export const OUTCOME_PAINT = {
  wins: "bg-primary",
  draws: "bg-muted-foreground",
  losses: "bg-surface-2",
} as const;

export type Outcome = keyof typeof OUTCOME_PAINT;
