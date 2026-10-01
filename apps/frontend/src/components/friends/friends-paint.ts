// The card under each tab of the Friends page, as the « A · Onglets » board draws it: its rows on
// two columns, inset 8 px from its 28 px corners; on one where its tab is too narrow for two (the
// Rail's smallest windows). Scrolls on its own, never the page.
export const FRIENDS_GRID_PAINT =
  "grid min-h-0 grid-cols-1 content-start gap-x-2 overflow-y-auto rounded-[28px] bg-card p-2 @xl:grid-cols-2";

// A tab with nothing in it, on the same card: why, in a sentence.
export const FRIENDS_PANEL_NOTE_PAINT =
  "rounded-[28px] bg-card px-6 py-10 text-center text-sm text-muted-foreground";
