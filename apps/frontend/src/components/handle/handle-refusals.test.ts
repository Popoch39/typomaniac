import { describe, expect, test } from "vitest";

import { refusalMessage } from "@/components/handle/handle-refusals";

const REASONS = ["too-short", "too-long", "invalid-chars", "reserved", "taken"] as const;

describe("refusalMessage", () => {
  test("says each refusal in French, the bounds from the Handle rules", () => {
    expect(REASONS.map((reason) => refusalMessage(reason, "fr"))).toEqual([
      "3 caractères minimum.",
      "20 caractères maximum.",
      "Seulement des lettres a-z, des chiffres et _.",
      "Ce Handle est réservé.",
      "Ce Handle est déjà pris.",
    ]);
  });

  test("says each refusal in English", () => {
    expect(REASONS.map((reason) => refusalMessage(reason, "en"))).toEqual([
      "At least 3 characters.",
      "At most 20 characters.",
      "Only letters a-z, digits and _.",
      "This Handle is reserved.",
      "This Handle is already taken.",
    ]);
  });
});
