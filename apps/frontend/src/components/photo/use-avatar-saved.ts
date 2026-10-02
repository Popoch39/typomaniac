import { useQueryClient } from "@tanstack/react-query";

import { type Me, meQueryOptions } from "@/api/me";
import { type Profile, profileQueryKey } from "@/api/profile";

// Writes the User the API sent back after a change of Photo in the cache: the User's card and every
// window of their Profile show the new Avatar at once. The other lists show it at their next read.
export const useAvatarSaved = () => {
  const queryClient = useQueryClient();

  return (me: Me) => {
    queryClient.setQueryData(meQueryOptions.queryKey, me);

    if (me.handle !== null) {
      queryClient.setQueriesData<Profile>({ queryKey: profileQueryKey(me.handle) }, (profile) =>
        profile === undefined ? profile : { ...profile, image: me.image },
      );
    }
  };
};
