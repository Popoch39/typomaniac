const endedAtFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

// When a finished Duel ended, as the Duels page and the Replay write it: « 27 sept. 2026, 21:14 ».
export const DuelTime = ({ endedAt }: { endedAt: number }) => (
  <time dateTime={new Date(endedAt).toISOString()}>{endedAtFormat.format(endedAt)}</time>
);
