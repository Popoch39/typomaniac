import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { meQueryOptions } from "@/api/me";
import { authClient } from "@/lib/auth-client";

// Closes the Session, then forgets the User: every page reads a Visitor at once.
export const useSignOut = () => {
  const queryClient = useQueryClient();

  return async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error("La déconnexion a échoué. Réessaie.");

      return;
    }

    queryClient.setQueryData(meQueryOptions.queryKey, null);
    toast.success("Déconnecté");
  };
};
