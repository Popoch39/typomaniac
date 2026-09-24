import { Loader2Icon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { DevEmailSignIn } from "@/components/auth/dev-email-sign-in";
import { DiscordIcon, GitHubIcon, GoogleIcon } from "@/components/auth/provider-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Provider } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";

type ProviderOption = {
  id: Provider;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// All three are always offered: one the API has not configured answers 404 and shows the start-up error toast.
const providers: ProviderOption[] = [
  { id: "github", label: "GitHub", Icon: GitHubIcon },
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "discord", label: "Discord", Icon: DiscordIcon },
];

// A keyboard key: the thick bottom edge is the key's depth, pressing it sinks the cap.
const keycapClassName =
  "group/key flex h-11 w-full items-center gap-3 border border-b-4 border-foreground/15 bg-background px-3 text-left text-xs font-medium transition-[translate,border-width] outline-none hover:border-foreground/30 focus-visible:border-caret focus-visible:ring-2 focus-visible:ring-caret/30 active:translate-y-0.5 active:border-b-2 disabled:pointer-events-none disabled:opacity-50";

export const SignInDialog = () => {
  const signInOpen = useAuthStore((state) => state.signInOpen);
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);
  const pendingProvider = useAuthStore((state) => state.pendingProvider);
  const startSignIn = useAuthStore((state) => state.startSignIn);

  return (
    <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
      <DialogContent className="gap-6 p-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="flex items-center text-lg font-bold">
            Se connecter
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-[1.1em] w-[0.55em] bg-caret motion-safe:animate-caret-blink"
            />
          </DialogTitle>
          <DialogDescription>
            Tes scores et ta progression te suivent d'un appareil à l'autre.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {providers.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={keycapClassName}
              disabled={pendingProvider !== null}
              onClick={() => startSignIn(id)}
            >
              {pendingProvider === id ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Icon className="size-4" />
              )}
              Continuer avec {label}
            </button>
          ))}
        </div>
        <p className="text-[0.7rem] text-muted-foreground">
          typomaniac ne récupère que ton nom, ton email et ton avatar.
        </p>
        {import.meta.env.DEV ? <DevEmailSignIn /> : null}
      </DialogContent>
    </Dialog>
  );
};
