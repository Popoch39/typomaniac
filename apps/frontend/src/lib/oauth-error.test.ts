import { describe, expect, test } from "vitest";

import { oauthErrorMessage } from "@/lib/oauth-error";

describe("oauthErrorMessage", () => {
  test("a refused consent tells the User the sign-in was cancelled", () => {
    expect(oauthErrorMessage("access_denied")).toBe(
      "Connexion annulée : l'autorisation a été refusée chez le fournisseur.",
    );
  });

  test("an email already used through another provider points back to it", () => {
    expect(oauthErrorMessage("account_not_linked")).toBe(
      "Cet email est déjà utilisé avec un autre fournisseur : connecte-toi avec celui-ci.",
    );
  });

  test("an unknown code falls back to a generic message", () => {
    expect(oauthErrorMessage("something_new")).toBe("La connexion a échoué. Réessaie.");
  });
});
