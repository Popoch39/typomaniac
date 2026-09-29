import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { FRIEND_QUERY_KEYS, type FriendAction, friendActions } from "@/api/friends";
import { friendErrorMessage } from "@/components/friends/friend-refusals";
import { useLocaleStore } from "@/stores/locale-store";

// One action on another User. Done or refused, the lists and the search are read again: a refusal
// often means they were stale (a request cancelled in the meantime, say). A refusal is toasted.
export const useFriendAction = (action: FriendAction, userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => friendActions[action](userId),
    // In the Locale shown when it fails, not when the action started.
    onError: (error) => {
      toast.error(friendErrorMessage(error, useLocaleStore.getState().locale));
    },
    onSettled: async () =>
      Promise.all(
        FRIEND_QUERY_KEYS.map(async (queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
};
