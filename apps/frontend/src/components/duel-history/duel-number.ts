const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

// A figure of a finished Duel, rounded and grouped by thousands (« 1 284 »); « — » for one that is
// not there: a Duel before the Score, a deleted opponent.
export const duelNumber = (value: number | null) =>
  value === null ? "—" : numberFormat.format(Math.round(value));
