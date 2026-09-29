import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The top of the Friends page, loaded or not.
export const FriendsHeader = () => {
  const locale = useLocale();

  return (
    <PageHeader
      title={m.friends_title({}, { locale })}
      subtitle={m.friends_subtitle({}, { locale })}
    />
  );
};
