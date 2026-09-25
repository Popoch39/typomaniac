import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FaceOffRank } from "@/components/face-off/face-off-rank";

describe("FaceOffRank", () => {
  test("shows the Tier, the Division and the TP of a ranked opponent", () => {
    render(<FaceOffRank rank={{ tier: "or", division: 2, tp: 42, shielded: false }} />);

    expect(screen.getByText("Or II · 42 TP")).toBeInTheDocument();
    expect(screen.queryByText("Challenge")).not.toBeInTheDocument();
  });

  test("shows the Placement Duels left of an opponent in Placement", () => {
    render(<FaceOffRank rank={{ placementsLeft: 3 }} />);

    expect(screen.getByText("Placement · 3 Duels restants")).toBeInTheDocument();
  });

  test("shows the Challenge badge in place of a rank when the Duel is not ranked", () => {
    render(<FaceOffRank rank={null} />);

    expect(screen.getByText("Challenge")).toBeInTheDocument();
    expect(screen.queryByText(/TP|Placement/)).not.toBeInTheDocument();
  });
});
