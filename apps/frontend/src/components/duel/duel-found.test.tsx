import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DuelFound } from "@/components/duel/duel-found";

const alan = { handle: "alan", image: null };

describe("DuelFound", () => {
  test("shows the opponent's rank when given", () => {
    render(
      <DuelFound opponent={alan} rank={{ tier: "or", division: 2, tp: 42, shielded: false }} />,
    );

    expect(screen.getByText("Or II · 42 TP")).toBeInTheDocument();
  });

  test("shows the Placement Duels left of an opponent in Placement", () => {
    render(<DuelFound opponent={alan} rank={{ placementsLeft: 3 }} />);

    expect(screen.getByText("Placement · 3 Duels restants")).toBeInTheDocument();
  });

  test("shows no rank without one", () => {
    render(<DuelFound opponent={alan} rank={null} />);

    expect(screen.getByRole("status")).toHaveTextContent(/Duel contre @alan$/);
  });
});
