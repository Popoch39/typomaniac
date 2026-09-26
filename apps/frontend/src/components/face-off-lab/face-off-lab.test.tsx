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
const stakeCard = () => screen.getByLabelText("Enjeu");

describe("FaceOffLab", () => {
  test("plays the Face-off against a ranked opponent on demand", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));

    expect(screen.getByText("@kzr_")).toBeInTheDocument();
    expect(screen.getByText("Or II · 42 TP")).toBeInTheDocument();
    // happy-dom never lays out the slider's track, so its thumb stays hidden to the role queries.
    expect(
      screen.getByLabelText("Temps du Face-off", { selector: "input[type=range]" }),
    ).toBeInTheDocument();
  });

  test("shows the Stake of an ordinary ranked Duel, then of one that moves up a Division", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    expect(stakeCard()).toHaveTextContent("En jeu");

    await userEvent.click(screen.getByRole("button", { name: "Montée de Division" }));
    expect(stakeCard()).toHaveTextContent("Gagne et passe Or II");
  });

  test("stages a Promotion Duel, then a Duel for Maître", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));

    await userEvent.click(screen.getByRole("button", { name: "Duel de promotion" }));
    expect(screen.getByText("Or I → Platine IV")).toBeInTheDocument();
    expect(stakeCard()).toHaveTextContent("Défaite −11 TP, tu restes Or I");

    await userEvent.click(screen.getByRole("button", { name: "Duel pour Maître" }));
    expect(screen.getByText("Diamant I → Maître")).toBeInTheDocument();
    expect(stakeCard()).toHaveTextContent("Gagne et passe Maître");
  });

  test("shows the Stake of a loss that moves down, one the shield holds, Fer IV and Maître", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));

    await userEvent.click(screen.getByRole("button", { name: "Descente" }));
    expect(stakeCard()).toHaveTextContent("Défaite −12 TP → Or III · 75 TP");

    await userEvent.click(screen.getByRole("button", { name: "Protégé" }));
    expect(stakeCard()).toHaveTextContent("Défaite −12 TP, protégé : tu restes Or II");

    await userEvent.click(screen.getByRole("button", { name: "Fer IV" }));
    expect(stakeCard()).toHaveTextContent("Défaite −12 TP, tu restes Fer IV · 0 TP");

    await userEvent.click(screen.getByRole("button", { name: "Maître" }));
    expect(stakeCard()).toHaveTextContent("Victoire +11 TP → Maître · 259 TP");
    expect(stakeCard()).not.toHaveTextContent("/ 100 TP");
  });

  test("switches the opponent to a Challenge", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    await userEvent.click(screen.getByRole("button", { name: "Challenge" }));

    // On both sides: a Challenge is ranked for neither.
    expect(screen.getAllByText("Challenge", { selector: "span" })).toHaveLength(2);
    expect(screen.queryByText("Or II · 42 TP")).not.toBeInTheDocument();
  });

  test("closes", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    await userEvent.click(screen.getByRole("button", { name: "Fermer le lab" }));

    expect(screen.queryByText("@kzr_")).not.toBeInTheDocument();
  });
});
