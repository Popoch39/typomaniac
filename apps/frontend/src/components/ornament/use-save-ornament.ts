import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { meQueryOptions } from "@/api/me";
import { saveOrnament } from "@/api/ornament";
import { type Profile, profileQueryKey } from "@/api/profile";

// Chooses the User's Ornament. Once saved, the User in the cache and every window of their Profile
// wear what the API resolved: the header and the Profile change at once.
export const useSaveOrnament = (handle: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveOrnament,
    onSuccess: (me) => {
      queryClient.setQueryData(meQueryOptions.queryKey, me);
      queryClient.setQueriesData<Profile>({ queryKey: profileQueryKey(handle) }, (profile) =>
        profile === undefined ? profile : { ...profile, ornament: me.ornament },
      );
    },
    onError: () => {
      toast.error("L'Ornament n'a pas pu être changé. Réessaie.");
    },
  });
};
