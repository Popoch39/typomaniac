import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The top of the Duels page, loaded or not.
export const DuelsHeader = () => {
  const locale = useLocale();

  return (
    <PageHeader title={m.duels_title({}, { locale })} subtitle={m.duels_subtitle({}, { locale })} />
  );
};
