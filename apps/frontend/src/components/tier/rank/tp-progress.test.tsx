import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TpProgress } from "@/components/tier/rank/tp-progress";
import { useLocaleStore } from "@/stores/locale-store";

describe("TpProgress", () => {
  test("a single Placement Duel played, in the singular", () => {
    render(<TpProgress rank={{ placementsLeft: 4 }} />);

    expect(screen.getByRole("meter", { name: "Placement" })).toHaveAttribute(
      "aria-valuetext",
      "1 Duel de Placement joué sur 5",
    );
  });

  test("the Placement Duels played, in the plural", () => {
    render(<TpProgress rank={{ placementsLeft: 2 }} />);

    expect(screen.getByRole("meter", { name: "Placement" })).toHaveAttribute(
      "aria-valuetext",
      "3 Duels de Placement joués sur 5",
    );
  });
});

describe("TpProgress in English", () => {
  test("a Division's TP out of 100, and what is left to the next rank", () => {
    useLocaleStore.setState({ locale: "en" });
    render(<TpProgress rank={{ tier: "gold", division: 2, tp: 42, shielded: false }} />);

    expect(screen.getByRole("meter", { name: "Division TP" })).toHaveAttribute(
      "aria-valuetext",
      "42 TP out of 100 · 58 TP to Gold I",
    );
  });

  test("the Placement Duels played", () => {
    useLocaleStore.setState({ locale: "en" });
    render(<TpProgress rank={{ placementsLeft: 4 }} />);

    expect(screen.getByRole("meter", { name: "Placement" })).toHaveAttribute(
      "aria-valuetext",
      "1 of 5 Placement Duels played",
    );
  });
});
