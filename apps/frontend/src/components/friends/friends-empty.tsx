import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FriendsEmptyProps = {
  // The search field, where looking for a User starts.
  searchInputId: string;
};

// No Friend yet: they come from a User found by their Handle.
export const FriendsEmpty = ({ searchInputId }: FriendsEmptyProps) => {
  const locale = useLocale();

  return (
    <EmptyState
      title={m.friends_empty_title({}, { locale })}
      reason={m.friends_empty_reason({}, { locale })}
      action={
        <Button onClick={() => document.getElementById(searchInputId)?.focus()}>
          {m.friends_empty_action({}, { locale })}
        </Button>
      }
    />
  );
};
