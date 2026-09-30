import type { Stats } from "@/api/profile";
import { OutcomeCount } from "@/components/profile/outcome-count";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Under the win rate's bar, each of its colours in words: the wins, the Draws, the losses (their
// Forfeits among them), and how many.
export const WinRateLegend = ({ record }: { record: Stats["record"] }) => {
  const locale = useLocale();

  return (
    <dl className="flex flex-col gap-2.5 text-[15px]">
      <OutcomeCount outcome="wins" term={m.profile_stat_wins({}, { locale })} count={record.wins} />
      <OutcomeCount
        outcome="draws"
        term={m.profile_stat_draws({}, { locale })}
        count={record.draws}
      />
      <OutcomeCount
        outcome="losses"
        term={m.profile_stat_losses({}, { locale })}
        count={record.losses}
      />
    </dl>
  );
};
