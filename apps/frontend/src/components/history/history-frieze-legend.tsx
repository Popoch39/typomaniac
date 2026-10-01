import { HEAT_PAINT } from "@/components/history/history-paint";
import { FRIEZE_WEEKS } from "@/components/history/history-week";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

// Under the frieze: how far it reaches, and its heats from fewer Duels to more.
export const HistoryFriezeLegend = () => {
  const locale = useLocale();

  return (
    <div className="flex items-center gap-2 font-journal-mono text-xs text-muted-foreground">
      <span>{m.history_frieze_span({ count: FRIEZE_WEEKS }, { locale })}</span>
      <span className="grow" />
      <span>{m.history_frieze_fewer({}, { locale })}</span>
      {HEAT_PAINT.map((paint) => (
        <span key={paint} className={cn("size-3 rounded-[3px]", paint)} />
      ))}
      <span>{m.history_frieze_more({}, { locale })}</span>
    </div>
  );
};
