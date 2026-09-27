import { duelOf, useDuelStore } from "@/stores/duel-store";

// The Duel's format at the right of the header, in its place of the User's menu. A Duel without
// ranks is a Challenge, never ranked, as the Face-off says.
export const DuelFormatChip = () => {
  const challenge = useDuelStore((store) => duelOf(store.state)?.selfRank === null);

  return (
    <p className="rounded-full bg-card px-3.5 py-2 text-[13px] leading-[normal] font-medium text-muted-foreground">
      {challenge ? "Challenge" : "Duel classé"} · 30 s · anglais
    </p>
  );
};
