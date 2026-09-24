import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH } from "handle";

import type { HandleUnavailable } from "@/api/handle";

// What the User reads when a Handle is refused: what to fix.
export const refusals: Record<HandleUnavailable, string> = {
  "too-short": `${HANDLE_MIN_LENGTH} caractères minimum.`,
  "too-long": `${HANDLE_MAX_LENGTH} caractères maximum.`,
  "invalid-chars": "Seulement des lettres a-z, des chiffres et _.",
  reserved: "Ce Handle est réservé.",
  taken: "Ce Handle est déjà pris.",
};
