import { describe, expect, test } from "vitest";

import { oauthErrorMessage } from "@/lib/oauth-error";

describe("oauthErrorMessage", () => {
  test("a refused consent tells the User the sign-in was cancelled", () => {
    expect(oauthErrorMessage("access_denied", "fr")).toBe(
      "Connexion annulée : l'autorisation a été refusée chez le fournisseur.",
    );
  });

  test("an email already used through another provider points back to it", () => {
    expect(oauthErrorMessage("account_not_linked", "fr")).toBe(
      "Cet email est déjà utilisé avec un autre fournisseur : connecte-toi avec celui-ci.",
    );
  });

  test("an unknown code falls back to a generic message", () => {
    expect(oauthErrorMessage("something_new", "fr")).toBe("La connexion a échoué. Réessaie.");
  });

  test("says every known code, and the unknown one, in English", () => {
    expect(
      [
        "access_denied",
        "account_not_linked",
        "email_not_verified",
        "email_not_found",
        "account_already_linked_to_different_user",
        "something_new",
      ].map((code) => oauthErrorMessage(code, "en")),
    ).toEqual([
      "Sign-in canceled: access was denied on the provider's end.",
      "This email is already used with another provider. Sign in with that one.",
      "Can't link this provider: your email isn't verified there.",
      "The provider didn't share an email, and you need one to sign in.",
      "This provider is already linked to another account.",
      "Sign-in failed. Try again.",
    ]);
  });
});
