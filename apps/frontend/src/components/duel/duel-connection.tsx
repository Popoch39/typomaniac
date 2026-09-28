type DuelConnectionProps = {
  // Whose connection is lost: this tab's, or the opponent's.
  lost: "self" | "opponent";
  // The opponent's Handle, as the app shows it.
  opponent: string;
};

// A lost connection during the Duel, this tab's or the opponent's, in a neutral pill: each side
// has a few seconds to come back before forfeiting.
export const DuelConnection = ({ lost, opponent }: DuelConnectionProps) => (
  <span className="rounded-full bg-secondary px-[18px] py-2.5 text-sm leading-none font-semibold whitespace-nowrap text-secondary-foreground">
    {lost === "self"
      ? "Connexion perdue, reconnexion…"
      : `Connexion de ${opponent} perdue : Forfeit sans retour sous 10 s.`}
  </span>
);
