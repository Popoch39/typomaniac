import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { FaceOffLab } from "@/components/face-off-lab/face-off-lab";
import { ClockContext } from "@/components/run/clock-context";

const clock = () => 0;

const renderLab = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ClockContext value={clock}>
        <FaceOffLab />
      </ClockContext>
    </QueryClientProvider>,
  );

// The lab's clock stands at the pairing, before the reveal: the Stake is there, still hidden, so
// without an accessible name yet.
const stakeLine = () => screen.getByLabelText("Enjeu");

// Picks one of the lab's pairings.
const pick = (pairing: string) => userEvent.click(screen.getByRole("button", { name: pairing }));

describe("FaceOffLab", () => {
  test("plays the Face-off against a ranked opponent on demand", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));

    expect(screen.getByText("@kzr_")).toBeInTheDocument();
    expect(screen.getByText("Gold II · 42 TP")).toBeInTheDocument();
    // happy-dom never lays out the slider's track, so its thumb stays hidden to the role queries.
    expect(
      screen.getByLabelText("Temps du Face-off", { selector: "input[type=range]" }),
    ).toBeInTheDocument();
  });

  test("shows the Stake of each ranked pairing: the TP a win and a loss would move", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    expect(stakeLine()).toHaveTextContent(/^Victoire \+14 TP Défaite −11 TP$/);

    await pick("Montée de Division");
    expect(stakeLine()).toHaveTextContent(/^Victoire \+12 TP Défaite −13 TP$/);

    await pick("Descente");
    expect(stakeLine()).toHaveTextContent(/^Victoire \+12 TP Défaite −12 TP$/);

    await pick("Protégé");
    expect(stakeLine()).toHaveTextContent(/^Victoire \+12 TP Défaite −12 TP$/);

    await pick("Iron IV");
    expect(stakeLine()).toHaveTextContent(/^Victoire \+14 TP Défaite −12 TP$/);

    await pick("Maniac");
    expect(stakeLine()).toHaveTextContent(/^Victoire \+11 TP Défaite −11 TP$/);
  });

  test("stages a Promotion Duel, then a Duel for Maniac", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));

    await userEvent.click(screen.getByRole("button", { name: "Duel de promotion" }));
    expect(screen.getByText("Gold I → Platinum IV")).toBeInTheDocument();
    expect(stakeLine()).toHaveTextContent(/^Victoire \+14 TP Défaite −11 TP$/);

    await userEvent.click(screen.getByRole("button", { name: "Duel pour Maniac" }));
    expect(screen.getByText("Diamond I → Maniac")).toBeInTheDocument();
    expect(stakeLine()).toHaveTextContent(/^Victoire \+9 TP Défaite −16 TP$/);
  });

  test("switches the opponent to a Challenge", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    await userEvent.click(screen.getByRole("button", { name: "Challenge" }));

    // On both sides: a Challenge is ranked for neither.
    expect(screen.getAllByText("Challenge", { selector: "span" })).toHaveLength(2);
    expect(screen.queryByText("Gold II · 42 TP")).not.toBeInTheDocument();
  });

  test("closes", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    await userEvent.click(screen.getByRole("button", { name: "Fermer le lab" }));

    expect(screen.queryByText("@kzr_")).not.toBeInTheDocument();
  });
});
