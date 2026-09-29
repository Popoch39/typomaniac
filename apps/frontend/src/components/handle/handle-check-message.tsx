import { cn } from "cn";

import { refusalMessage } from "@/components/handle/handle-refusals";
import type { HandleStatus } from "@/components/handle/use-handle-check";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const messageOf = (status: HandleStatus, locale: Locale) => {
  switch (status.kind) {
    case "refused":
      return refusalMessage(status.reason, locale);
    case "current":
      return m.handle_check_current({}, { locale });
    case "checking":
      return m.handle_check_checking({}, { locale });
    case "available":
      return m.handle_check_available({}, { locale });
    case "unknown":
      return m.handle_check_unknown({}, { locale });
  }
};

const toneOf = (status: HandleStatus) => {
  switch (status.kind) {
    case "refused":
      return "text-destructive";
    case "available":
      return "text-caret";
    default:
      return "text-muted-foreground";
  }
};

// What the live check says of the Handle being typed, read out as it changes.
export const HandleCheckMessage = ({ id, status }: { id: string; status: HandleStatus }) => {
  const locale = useLocale();

  return (
    <p id={id} aria-live="polite" className={cn("text-[0.7rem]", toneOf(status))}>
      {messageOf(status, locale)}
    </p>
  );
};
