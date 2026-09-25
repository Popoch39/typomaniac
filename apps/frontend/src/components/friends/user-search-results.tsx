import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { HANDLE_SEARCH_MIN_LENGTH } from "handle";

import { ApiError } from "@/api/client";
import { userSearchQueryOptions } from "@/api/user-search";
import { UserFoundItem } from "@/components/friends/user-found-item";
import { UserRowsSkeleton } from "@/components/friends/user-rows-skeleton";

type UserSearchResultsProps = {
  // The start of a Handle, once the User has paused typing.
  handle: string;
};

const errorMessage = (error: Error) =>
  error instanceof ApiError && error.status === 429
    ? "Trop de recherches d'affilée : patiente un instant."
    : "La recherche a échoué. Réessaie.";

// The Users found for what was typed. The previous results stay on screen while the next ones load.
export const UserSearchResults = ({ handle }: UserSearchResultsProps) => {
  const searchable = handle.length >= HANDLE_SEARCH_MIN_LENGTH;

  const search = useQuery({
    ...userSearchQueryOptions(handle),
    enabled: searchable,
    placeholderData: keepPreviousData,
  });

  if (!searchable) {
    return (
      <p className="text-muted-foreground">
        Tape au moins {HANDLE_SEARCH_MIN_LENGTH} caractères du Handle.
      </p>
    );
  }

  if (search.isError) {
    return (
      <p role="alert" className="text-destructive">
        {errorMessage(search.error)}
      </p>
    );
  }

  if (search.isPending) {
    return <UserRowsSkeleton label="Recherche des Users" rows={2} />;
  }

  if (search.data.length === 0) {
    return (
      <p className="px-1 text-sm text-muted-foreground">
        Aucun User dont le Handle commence ainsi.
      </p>
    );
  }

  return (
    <ul
      aria-busy={search.isPlaceholderData}
      className="flex flex-col divide-y divide-border overflow-hidden rounded-card bg-card"
    >
      {search.data.map((user) => (
        <UserFoundItem key={user.id} user={user} />
      ))}
    </ul>
  );
};
