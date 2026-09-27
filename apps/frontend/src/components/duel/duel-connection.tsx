type DuelConnectionProps = { opponent: string; connected: boolean; opponentConnected: boolean };

// A lost connection during the Duel, this tab's or the opponent's: each side has a few seconds to
// come back before forfeiting.
export const DuelConnection = ({ opponent, connected, opponentConnected }: DuelConnectionProps) => {
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
