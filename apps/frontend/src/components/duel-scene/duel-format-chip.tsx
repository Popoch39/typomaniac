// The Duel's format at the right of the Duel's scene's header: a Challenge is never ranked.
export const DuelFormatChip = ({ challenge }: { challenge: boolean }) => (
  <p className="rounded-full bg-card px-3.5 py-2 text-[13px] leading-[normal] font-medium text-muted-foreground">
    {challenge ? "Challenge" : "Duel classé"} · 30 s · anglais
  </p>
);
