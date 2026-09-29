import { create } from "zustand";

import { authClient, type Provider } from "@/lib/auth-client";
import { markOAuthRoundTrip } from "@/lib/oauth-round-trip";
import { toast } from "@/lib/toast";
import { m } from "@/paraglide/messages";
import { useLocaleStore } from "@/stores/locale-store";

type AuthState = {
  signInOpen: boolean;
  // Set from the click until the browser leaves for the provider.
  pendingProvider: Provider | null;
  setSignInOpen: (open: boolean) => void;
  startSignIn: (provider: Provider) => Promise<void>;
  // The User without a Handle put the choice off (Plus tard) for this visit: Runs solo only.
  handleChoiceDeferred: boolean;
  setHandleChoiceDeferred: (deferred: boolean) => void;
};

// UI state of the sign-in flow and of the Handle choice that follows it: the User itself lives in
// React Query (`meQueryOptions`).
export const useAuthStore = create<AuthState>()((set) => ({
  signInOpen: false,
  pendingProvider: null,
  setSignInOpen: (open) => set({ signInOpen: open }),
  handleChoiceDeferred: false,
  setHandleChoiceDeferred: (deferred) => set({ handleChoiceDeferred: deferred }),
  startSignIn: async (provider) => {
    set({ pendingProvider: provider });
    // Set before the call, which redirects on its own: the page the provider sends back to plays
    // no Intro.
    markOAuthRoundTrip(true);

    // The provider sends the User back to this very page, with `?error=` on failure, and in the
    // current Locale: the URL carries it ("/en/…"), as the router writes every URL.
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: window.location.href,
      errorCallbackURL: window.location.href,
    });

    if (error) {
      markOAuthRoundTrip(false);
      set({ pendingProvider: null });
      toast.error(m.auth_start_failed({}, { locale: useLocaleStore.getState().locale }));
    }
  },
}));
