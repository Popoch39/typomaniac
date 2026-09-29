import { useQueryClient } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Closes the Session, then forgets the User: every page reads a Visitor at once.
export const useSignOut = () => {
  const queryClient = useQueryClient();
  const locale = useLocale();

  return async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(m.auth_sign_out_failed({}, { locale }));

      return;
    }

    queryClient.setQueryData(meQueryOptions.queryKey, null);
    toast.success(m.auth_signed_out({}, { locale }));
  };
};
