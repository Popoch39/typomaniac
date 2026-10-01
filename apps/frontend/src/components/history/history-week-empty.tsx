import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// No Duel in the week shown: another week, or a Duel now.
export const HistoryWeekEmpty = () => {
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-card p-12 text-center">
      <h2 className="text-2xl font-extrabold">{m.history_empty_title({}, { locale })}</h2>
      <p className="text-muted-foreground">{m.history_empty_reason({}, { locale })}</p>
      <Button
        className="rounded-[14px] px-5 font-bold"
        nativeButton={false}
        render={<Link to="/" />}
      >
        {m.history_empty_action({}, { locale })}
      </Button>
    </div>
  );
};
