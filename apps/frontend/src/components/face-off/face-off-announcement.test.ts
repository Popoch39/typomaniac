import { describe, expect, test } from "vitest";

import { faceOffAnnouncement } from "@/components/face-off/face-off-announcement";

describe("faceOffAnnouncement", () => {
  test("names the opponent during the Face-off", () => {
    expect(faceOffAnnouncement(-4500, "alan")).toBe("Duel contre @alan");
    expect(faceOffAnnouncement(-3100, "alan")).toBe("Duel contre @alan");
  });

  test("names a Promotion Duel for what it is", () => {
    expect(faceOffAnnouncement(-4500, "alan", "Duel de promotion")).toBe(
      "Duel de promotion contre @alan",
    );
    expect(faceOffAnnouncement(-3100, "alan", "Duel pour Maniac")).toBe(
      "Duel pour Maniac contre @alan",
    );
    expect(faceOffAnnouncement(-2000, "alan", "Duel de promotion")).toBe("2");
  });

  test("counts 3, 2, 1 on the seconds left before the start", () => {
    expect(faceOffAnnouncement(-3000, "alan")).toBe("3");
    expect(faceOffAnnouncement(-2100, "alan")).toBe("3");
    expect(faceOffAnnouncement(-2000, "alan")).toBe("2");
    expect(faceOffAnnouncement(-100, "alan")).toBe("1");
  });

  test("says go at the start", () => {
    expect(faceOffAnnouncement(0, "alan")).toBe("Partez !");
    expect(faceOffAnnouncement(400, "alan")).toBe("Partez !");
  });
});
