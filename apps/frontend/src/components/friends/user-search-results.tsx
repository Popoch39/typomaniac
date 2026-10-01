import { useQuery } from "@tanstack/react-query";
import { HANDLE_SEARCH_MIN_LENGTH } from "handle";

import { ApiError } from "@/api/client";
import { userSearchQueryOptions } from "@/api/user-search";
import { UserFoundItem } from "@/components/friends/user-found-item";
import { UserRowsSkeleton } from "@/components/friends/user-rows-skeleton";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type UserSearchResultsProps = {
  // The start of a Handle, as typed right now.
  typed: string;
  // The start of a Handle, once the User has paused typing.
  handle: string;
};

const errorMessage = (error: Error, locale: Locale) =>
  error instanceof ApiError && error.code === "TOO_MANY_REQUESTS"
    ? m.friends_search_too_many({}, { locale })
    : m.friends_search_failed({}, { locale });

// The Users found for what was typed. Skeletons stand in from the first key until the Users of that
// Handle are there.
export const UserSearchResults = ({ typed, handle }: UserSearchResultsProps) => {
  const locale = useLocale();
  const searchable = typed.length >= HANDLE_SEARCH_MIN_LENGTH;

  const search = useQuery({
    ...userSearchQueryOptions(handle),
    enabled: handle.length >= HANDLE_SEARCH_MIN_LENGTH,
  });

  if (!searchable) {
    return (
      <p className="px-3 py-2.5 text-sm text-muted-foreground">
        {m.friends_search_min_length(
          {
            count: HANDLE_SEARCH_MIN_LENGTH,
            shown: numberFormat(locale).format(HANDLE_SEARCH_MIN_LENGTH),
          },
          { locale },
        )}
      </p>
    );
  }

  if (typed !== handle || search.isPending) {
    return <UserRowsSkeleton label={m.friends_search_loading({}, { locale })} rows={2} />;
  }

  if (search.isError) {
    return (
      <p role="alert" className="px-3 py-2.5 text-sm text-destructive">
        {errorMessage(search.error, locale)}
      </p>
    );
  }

  if (search.data.length === 0) {
    return (
      <p className="px-3 py-2.5 text-sm text-muted-foreground">
        {m.friends_search_none({}, { locale })}
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {search.data.map((user) => (
        <UserFoundItem key={user.id} user={user} />
      ))}
    </ul>
  );
};
