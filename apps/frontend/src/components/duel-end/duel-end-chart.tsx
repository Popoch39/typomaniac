import { lazy, Suspense } from "react";

import { NothingOnError } from "@/components/duel/nothing-on-error";
import { DUEL_END_CARD_PAINT } from "@/components/duel-end/duel-end-paint";
import { DuelChartSkeleton } from "@/components/duel-chart/duel-chart-skeleton";
import { LoadingRegion } from "@/components/ui/loading-region";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// recharts stays out of the home page's bundle until a Duel ends.
const WrittenDuelChart = lazy(async () => {
  const module = await import("@/components/duel/written-duel-chart");

  return { default: module.WrittenDuelChart };
});

// The written Duel's chart in its card, like the tale of the tape's; the card goes with it when
// the Duel fails to load.
export const DuelEndChart = ({ duelId }: { duelId: string }) => {
  const locale = useLocale();

  return (
    <NothingOnError>
      <section
        aria-label={m.duel_ended_chart({}, { locale })}
        data-entrance="chart"
        className={DUEL_END_CARD_PAINT}
      >
        <Suspense
          fallback={
            <LoadingRegion label={m.duel_ended_chart_loading({}, { locale })}>
              <DuelChartSkeleton />
            </LoadingRegion>
          }
        >
          <WrittenDuelChart duelId={duelId} />
        </Suspense>
      </section>
    </NothingOnError>
  );
};
