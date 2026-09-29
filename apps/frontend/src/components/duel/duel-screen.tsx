import { DuelElsewhere } from "@/components/duel/duel-elsewhere";
import { DuelEnded } from "@/components/duel/duel-ended";
import { DuelInterrupted } from "@/components/duel/duel-interrupted";
import { DuelToResume } from "@/components/duel/duel-to-resume";
import { DuelTypingArea } from "@/components/duel/duel-typing-area";
import { SearchDuelLink } from "@/components/duel/search-duel-link";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useDuelStore } from "@/stores/duel-store";

// The Duel on its own URL: its Countdown, its typing and its end. Played by another tab, the place
// can be taken back; lost with the connection, a new search starts from the play page. The Queue's
// phases are no Duel: nothing to show, then back to the play page.
export const DuelScreen = () => {
  const locale = useLocale();
  const state = useDuelStore((store) => store.state);

  switch (state.phase) {
    case "countdown":
    case "running":
      return <DuelTypingArea duel={state.duel} ending={null} />;
    case "finishing":
      return <DuelTypingArea duel={state.duel} ending={state.ending} />;
    case "ended":
      return <DuelEnded ending={state.ending} />;
    case "elsewhere":
      return <DuelElsewhere />;
    case "disconnected":
      return (
        <DuelInterrupted message={m.duel_disconnected({}, { locale })}>
          <SearchDuelLink label={m.queue_search_duel({}, { locale })} />
        </DuelInterrupted>
      );
    case "connecting":
    case "queued":
    case "locked":
    case "proposed":
    case "handle-required":
      return <DuelToResume />;
  }
};
