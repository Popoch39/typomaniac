// Every Duel has the same format, set by the server: shown, not chosen.
export const DuelFormat = () => (
  <p className="flex h-13 items-center rounded-full bg-card px-5 text-xs text-muted-foreground">
    <span className="sr-only">Format du Duel : </span>time 30 · anglais
  </p>
);
