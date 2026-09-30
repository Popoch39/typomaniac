import { useSuspenseQuery } from "@tanstack/react-query";

import { profileQueryOptions } from "@/api/profile";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Under the Handle in a Profile's header: how many Duels the User finished, « 142 Duels ».
export const ProfileDuels = ({ handle }: { handle: string }) => {
  const locale = useLocale();
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle));
  const { duels } = profile.stats;

  return m.profile_duels({ count: duels, shown: numberFormat(locale).format(duels) }, { locale });
};
