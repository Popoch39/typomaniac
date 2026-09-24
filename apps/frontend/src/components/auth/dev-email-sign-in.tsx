import { useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";

import { meQueryOptions } from "@/api/me";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";

const inputClassName =
  "h-9 w-full border border-foreground/15 bg-background px-3 text-xs outline-none focus-visible:border-caret focus-visible:ring-2 focus-visible:ring-caret/30";

// Out of the production build (ADR 0005): opens as many Users as a Duel test needs, with no
// email sent. The name is the email's local part, enough to tell the two players apart.
export const DevEmailSignIn = () => {
  const queryClient = useQueryClient();
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  const [error, submit, pending] = useActionState(
    async (_previous: string | null, form: FormData) => {
      const email = String(form.get("email"));
      const password = String(form.get("password"));

      const { error: failure } =
        form.get("intent") === "sign-up"
          ? await authClient.signUp.email({ email, password, name: email.split("@")[0] ?? email })
          : await authClient.signIn.email({ email, password });

      if (failure) {
        return failure.message ?? "La connexion a échoué.";
      }

      await queryClient.invalidateQueries({ queryKey: meQueryOptions.queryKey });
      setSignInOpen(false);

      return null;
    },
    null,
  );

  return (
    <form action={submit} className="flex flex-col gap-2 border-t border-dashed pt-4">
      <p className="text-[0.7rem] font-medium text-muted-foreground uppercase">Dev</p>
      <input
        name="email"
        type="email"
        required
        autoComplete="username"
        placeholder="alice@dev.test"
        aria-label="Email"
        className={inputClassName}
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="current-password"
        placeholder="Mot de passe (8 caractères min.)"
        aria-label="Mot de passe"
        className={inputClassName}
      />
      {error ? (
        <p role="alert" className="text-[0.7rem] text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" name="intent" value="sign-in" disabled={pending} className="flex-1">
          Se connecter
        </Button>
        <Button
          type="submit"
          name="intent"
          value="sign-up"
          variant="outline"
          disabled={pending}
          className="flex-1"
        >
          Créer le compte
        </Button>
      </div>
    </form>
  );
};
