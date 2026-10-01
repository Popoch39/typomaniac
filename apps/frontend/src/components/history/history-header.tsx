import type { ReactNode } from "react";

import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The top of the History, loaded or not: its title, what it is for, and at its right the way from
// week to week.
export const HistoryHeader = ({ nav }: { nav: ReactNode }) => {
  const locale = useLocale();

  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[56px] leading-none font-black tracking-[-0.03em]">
          {m.history_title({}, { locale })}
        </h1>
        <p className="text-base text-muted-foreground">{m.history_subtitle({}, { locale })}</p>
      </div>
      {nav}
    </header>
  );
};
