// The colour of the TP a Duel moved: the accent for a gain, muted for a loss.
export const tpTone = (tp: number) => (tp >= 0 ? "text-primary" : "text-muted-foreground");
