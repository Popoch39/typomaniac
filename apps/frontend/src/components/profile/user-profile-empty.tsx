import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Another User without a finished Duel: nothing to show, nothing for the viewer to do.
export const UserProfileEmpty = () => {
  const locale = useLocale();

  return (
    <EmptyState
      title={m.profile_empty_title({}, { locale })}
      reason={m.profile_empty_other_reason({}, { locale })}
    />
  );
};
