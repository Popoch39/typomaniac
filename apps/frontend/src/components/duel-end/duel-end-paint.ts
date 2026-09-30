// A card of the end screen, as the board draws the tale of the tape's; the Duel chart's is the same.
export const DUEL_END_CARD_PAINT = "rounded-card bg-card px-11 py-7";

// The row of ways out: every button 64 px high at 20 px corners, lighter on hover.
const DUEL_END_BUTTON_PAINT = "h-16 rounded-[20px] hover:brightness-112";

// Nouveau Duel on the rest of the row, in the accent, as the obvious way on.
export const NEW_DUEL_PAINT = `${DUEL_END_BUTTON_PAINT} flex-grow font-display text-lg font-extrabold tracking-[0.04em] uppercase hover:bg-primary`;

// Revoir and Retour au Solo beside it, raised.
export const DUEL_END_LINK_PAINT = `${DUEL_END_BUTTON_PAINT} w-[220px] gap-2.5 text-[17px] font-bold hover:bg-secondary [&_svg:not([class*='size-'])]:size-[18px]`;
