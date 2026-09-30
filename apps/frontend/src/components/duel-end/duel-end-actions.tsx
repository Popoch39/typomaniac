import { ReplayDuelLink } from "@/components/duel/replay-duel-link";
import { SearchDuelLink } from "@/components/duel/search-duel-link";
import { SoloLink } from "@/components/duel/solo-link";
import { DUEL_END_LINK_PAINT, NEW_DUEL_PAINT } from "@/components/duel-end/duel-end-paint";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The ways out of a Duel's end: Nouveau Duel joins the Queue again, Revoir opens its Replay,
// Retour au Solo goes back to Jouer.
export const DuelEndActions = ({ duelId }: { duelId: string }) => {
  const locale = useLocale();

  return (
    <nav
      aria-label={m.duel_ended_after({}, { locale })}
      data-entrance="actions"
      className="flex gap-3"
    >
      <SearchDuelLink
        label={m.duel_ended_new_duel({}, { locale })}
        variant="default"
        className={NEW_DUEL_PAINT}
      />
      <ReplayDuelLink duelId={duelId} className={DUEL_END_LINK_PAINT} />
      <SoloLink className={DUEL_END_LINK_PAINT} />
    </nav>
  );
};
