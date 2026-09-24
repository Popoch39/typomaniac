import { duelOf, useDuelStore } from "@/stores/duel-store";

// A lost connection during the Duel, this tab's or the opponent's: each side has a few seconds to
// come back before forfeiting.
export const DuelConnection = ({ opponent }: { opponent: string }) => {
  const connected = useDuelStore((store) => duelOf(store.state)?.connected ?? true);
  const opponentConnected = useDuelStore((store) => duelOf(store.state)?.opponentConnected ?? true);

  if (!connected) {
    return <output className="text-center text-destructive">Connexion perdue, reconnexion…</output>;
  }

  if (!opponentConnected) {
    return (
      <output className="text-center text-muted-foreground">
        Connexion de {opponent} perdue : Forfeit sans retour sous 10 s.
      </output>
    );
  }

  return null;
};
