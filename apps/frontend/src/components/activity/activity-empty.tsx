import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type ActivityEmptyProps = {
  // The search field, where finding a Friend starts.
  searchInputId: string;
};

// Nothing from the Friends yet: without Friends, or before they play.
export const ActivityEmpty = ({ searchInputId }: ActivityEmptyProps) => {
  const locale = useLocale();

  return (
    <EmptyState
      title={m.activity_empty_title({}, { locale })}
      reason={m.activity_empty_reason({}, { locale })}
      action={
        <Button onClick={() => document.getElementById(searchInputId)?.focus()}>
          {m.activity_empty_action({}, { locale })}
        </Button>
      }
    />
  );
};
