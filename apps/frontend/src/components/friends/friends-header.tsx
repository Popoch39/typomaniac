import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FriendsHeaderProps = {
  // At the right of the title: the search, or its Skeleton. None without a Handle.
  search?: ReactNode;
};

// The top of the Friends page, loaded or not.
export const FriendsHeader = ({ search }: FriendsHeaderProps) => {
  const locale = useLocale();

  return (
    <PageHeader
      title={m.friends_title({}, { locale })}
      subtitle={m.friends_subtitle({}, { locale })}
      actions={search}
    />
  );
};
