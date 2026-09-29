import { describe, expect, test } from "vitest";

import { bandLabel, discLead } from "@/components/duel-hud/band-lead";

describe("bandLabel", () => {
  test("says who leads and by how many points, one or more, in French", () => {
    expect(bandLabel(1, "kzr_", "fr")).toBe("Tu mènes de 1 point");
    expect(bandLabel(12, "kzr_", "fr")).toBe("Tu mènes de 12 points");
    expect(bandLabel(-1, "kzr_", "fr")).toBe("@kzr_ mène de 1 point");
    expect(bandLabel(-30, "kzr_", "fr")).toBe("@kzr_ mène de 30 points");
    expect(bandLabel(0, "kzr_", "fr")).toBe("Même Score");
  });

  test("and in English", () => {
    expect(bandLabel(1, "kzr_", "en")).toBe("You lead by 1 point");
    expect(bandLabel(1284, "kzr_", "en")).toBe("You lead by 1,284 points");
    expect(bandLabel(-1, "kzr_", "en")).toBe("@kzr_ leads by 1 point");
    expect(bandLabel(-30, "kzr_", "en")).toBe("@kzr_ leads by 30 points");
    expect(bandLabel(0, "kzr_", "en")).toBe("Scores tied");
  });
});

describe("discLead", () => {
  test("is the Lead whoever leads, = at equal Scores", () => {
    expect(discLead(12, "fr")).toBe("+12");
    expect(discLead(-12, "fr")).toBe("+12");
    expect(discLead(0, "fr")).toBe("=");
  });

  test("groups its thousands as the Locale does", () => {
    expect(discLead(1284, "en")).toBe("+1,284");
    // French groups with a narrow no-break space.
    expect(discLead(-1284, "fr")).toBe("+1 284");
  });
});
