// Codes Better Auth puts in `?error=` when the OAuth callback fails (better-auth/dist/oauth2/errors.mjs),
// plus `access_denied`, forwarded as-is from the provider when the User refuses consent.
const messages = new Map([
  ["access_denied", "Connexion annulée : l'autorisation a été refusée chez le fournisseur."],
  // The email already belongs to a User, but this provider is not trusted to link to it (Discord without a verified email).
  [
    "account_not_linked",
    "Cet email est déjà utilisé avec un autre fournisseur : connecte-toi avec celui-ci.",
  ],
  ["email_not_verified", "Impossible de rattacher ce fournisseur : ton email n'y est pas vérifié."],
  ["email_not_found", "Le fournisseur n'a pas transmis d'email : il en faut un pour se connecter."],
  [
    "account_already_linked_to_different_user",
    "Ce fournisseur est déjà rattaché à un autre utilisateur.",
  ],
]);

const fallbackMessage = "La connexion a échoué. Réessaie.";

export const oauthErrorMessage = (code: string) => messages.get(code) ?? fallbackMessage;
