import type { Letter } from "typing-engine";

// A letter still pending once its word is validated was skipped: it shows as missed. The engine
// has no such status, `missed` only exists on screen.
export const displayedStatus = (letter: Letter, validated: boolean) =>
  validated && letter.status === "pending" ? "missed" : letter.status;
