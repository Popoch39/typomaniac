import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DuelFormat } from "@/components/settings/duel-format";
import { useLocaleStore } from "@/stores/locale-store";

describe("the Duel's format in the settings", () => {
  test("names the Duel's Language in French", () => {
    render(<DuelFormat />);

    expect(screen.getByText("time 30 · anglais")).toHaveTextContent(
      "Format du Duel : time 30 · anglais",
    );
  });

  test("names the Duel's Language in English", () => {
    useLocaleStore.setState({ locale: "en" });
    render(<DuelFormat />);

    expect(screen.getByText("time 30 · English")).toHaveTextContent(
      "Duel format: time 30 · English",
    );
  });
});
