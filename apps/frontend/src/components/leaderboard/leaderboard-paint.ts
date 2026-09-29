// The reader's own place, on the podium or in the list: tinted with the accent, ringed by it.
export const MINE_PLACE_PAINT = "bg-primary/15 ring-[1.5px] ring-primary ring-inset";

// The initials of an avatar without an image: the reader's on the accent, the others on the card.
export const initialsPaint = (mine: boolean) =>
  mine ? "bg-primary text-on-brand" : "bg-surface-2 text-foreground";
