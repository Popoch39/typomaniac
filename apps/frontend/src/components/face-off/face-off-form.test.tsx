import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FaceOffForm } from "@/components/face-off/face-off-form";

describe("FaceOffForm", () => {
  test("shows each of the last Ranked Duels, the most recent first, and the average wpm", () => {
    render(<FaceOffForm form={{ avgWpm: 71.6, outcomes: ["win", "loss", "draw", "win"] }} />);

    expect(
      screen.getAllByText(/^(Victoire|Défaite|Draw)$/).map((mark) => mark.textContent),
    ).toEqual(["Victoire", "Défaite", "Draw", "Victoire"]);
    expect(screen.getByText("72 wpm")).toBeInTheDocument();
  });

  test("shows the Form as absent without a Ranked Duel, never as zero", () => {
    render(<FaceOffForm form={null} />);

    expect(screen.getByText("Aucun Duel classé")).toBeInTheDocument();
    expect(screen.queryByText(/wpm/)).not.toBeInTheDocument();
  });
});
