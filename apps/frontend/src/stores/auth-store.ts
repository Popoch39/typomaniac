import { toast } from "sonner";
import { create } from "zustand";

import { authClient, type Provider } from "@/lib/auth-client";

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

    // The provider sends the User back to this very page, with `?error=` on failure.
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: window.location.href,
      errorCallbackURL: window.location.href,
    });

    if (error) {
      set({ pendingProvider: null });
      toast.error("La connexion n'a pas pu démarrer. Réessaie.");
    }
  },
}));
