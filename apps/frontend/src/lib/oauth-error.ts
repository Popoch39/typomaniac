import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// Codes Better Auth puts in `?error=` when the OAuth callback fails (better-auth/dist/oauth2/errors.mjs),
// plus `access_denied`, forwarded as-is from the provider when the User refuses consent.
const OAUTH_ERROR_MESSAGES = new Map([
  ["access_denied", m.auth_oauth_access_denied],
  // The email already belongs to a User, but this provider is not trusted to link to it (Discord without a verified email).
  ["account_not_linked", m.auth_oauth_account_not_linked],
  ["email_not_verified", m.auth_oauth_email_not_verified],
  ["email_not_found", m.auth_oauth_email_not_found],
  ["account_already_linked_to_different_user", m.auth_oauth_account_already_linked],
]);

export const oauthErrorMessage = (code: string, locale: Locale) =>
  (OAUTH_ERROR_MESSAGES.get(code) ?? m.auth_oauth_failed)({}, { locale });
