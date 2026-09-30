import { ArrowLeftIcon } from "lucide-react";

import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Under the search: the Friends online are in the sidebar, to challenge while the User waits. It
// fades out as the search folds.
export const QueueTip = () => {
  const locale = useLocale();

  return (
    <p data-search-leaves className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <ArrowLeftIcon aria-hidden className="size-4.5" />
      {m.queue_tip({}, { locale })}
    </p>
  );
};
