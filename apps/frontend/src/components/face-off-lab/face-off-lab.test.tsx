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

  test("switches the opponent to a Challenge", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    await userEvent.click(screen.getByRole("button", { name: "Challenge" }));

    expect(screen.getByText("Challenge", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByText("Or II · 42 TP")).not.toBeInTheDocument();
  });

  test("closes", async () => {
    renderLab();

    await userEvent.click(screen.getByRole("button", { name: "Face-off" }));
    await userEvent.click(screen.getByRole("button", { name: "Fermer le lab" }));

    expect(screen.queryByText("@kzr_")).not.toBeInTheDocument();
  });
});
