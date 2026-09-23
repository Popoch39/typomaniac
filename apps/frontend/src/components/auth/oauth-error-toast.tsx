import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { oauthErrorMessage } from "@/lib/oauth-error";

// Better Auth sends a failed OAuth round trip back with `?error=<code>`: say it once, then drop it from the URL.
export const OAuthErrorToast = () => {
  const error = useSearch({ from: "__root__", select: (search) => search.error });
  const navigate = useNavigate();

  useEffect(() => {
    if (!error) {
      return;
    }

    // A fixed id keeps StrictMode's double effect from stacking two toasts.
    toast.error(oauthErrorMessage(error), { id: "oauth-error" });
    void navigate({
      to: ".",
      search: (previous) => ({ ...previous, error: undefined }),
      replace: true,
    });
  }, [error, navigate]);

  return null;
};
