import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// How long the opponent has to come back before forfeiting, in seconds, as the server counts it.
const COMEBACK_S = 10;

type DuelConnectionProps = {
  // Whose connection is lost: this tab's, or the opponent's.
  lost: "self" | "opponent";
  // The opponent's Handle, as the app shows it.
  opponent: string;
};

// A lost connection during the Duel, this tab's or the opponent's, in a neutral pill: each side
// has a few seconds to come back before forfeiting.
export const DuelConnection = ({ lost, opponent }: DuelConnectionProps) => {
  const locale = useLocale();

  return (
    <span className="rounded-full bg-secondary px-[18px] py-2.5 text-sm leading-none font-semibold whitespace-nowrap text-secondary-foreground">
      {lost === "self"
        ? m.hud_connection_lost({}, { locale })
        : m.hud_opponent_connection_lost(
            { opponent, count: COMEBACK_S, shown: numberFormat(locale).format(COMEBACK_S) },
            { locale },
          )}
    </span>
  );
};
