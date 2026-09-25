import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { FaceOff } from "@/components/face-off/face-off";
import { ClockContext } from "@/components/run/clock-context";

const STARTS_AT = 10_000;

const alan = { handle: "alan", image: null };

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
};

let now = 0;

const clock = () => now;

// The Face-off as the Duel shows it, `elapsed` ms into the Duel, the tab's clock on the same time.
const faceOffAt = (elapsed: number) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  now = STARTS_AT + elapsed;

  const face = (at: number) => (
    <QueryClientProvider client={queryClient}>
      <ClockContext value={clock}>
        <FaceOff opponent={alan} opponentRank={null} startsAt={STARTS_AT} elapsed={at} />
      </ClockContext>
    </QueryClientProvider>
  );

  const { rerender } = render(face(elapsed));

  return {
    at: (next: number) => {
      now = STARTS_AT + next;
      rerender(face(next));
    },
  };
};

describe("FaceOff", () => {
  test("shows both players during the Countdown, the opponent's Challenge badge included", () => {
    faceOffAt(-4500);

    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByText("@alan")).toBeInTheDocument();
    expect(screen.getByText("Challenge")).toBeInTheDocument();
  });

  test("slides each player's Handle, repeated, behind their panel", () => {
    faceOffAt(-4500);

    expect(screen.getAllByText(/^ada · ada · /)).not.toHaveLength(0);
    expect(screen.getAllByText(/^alan · alan · /)).not.toHaveLength(0);
  });

  test("falls back on the initials of a player without an avatar", () => {
    faceOffAt(-4500);

    expect(screen.getAllByText("A")).toHaveLength(2);
  });

  test("announces the Countdown in its live region", () => {
    const faceOff = faceOffAt(-4500);

    expect(screen.getByRole("status")).toHaveTextContent("Duel contre @alan");

    faceOff.at(-1500);
    expect(screen.getByRole("status")).toHaveTextContent(/^2$/);
  });

  test("stays over the start for its exit, then goes", () => {
    const faceOff = faceOffAt(-100);

    faceOff.at(200);
    expect(screen.getByText("@alan")).toBeInTheDocument();

    faceOff.at(1000);
    expect(screen.queryByText("@alan")).not.toBeInTheDocument();
  });

  test("never shows in a Duel resumed after its start", () => {
    faceOffAt(200);

    expect(screen.queryByText("@alan")).not.toBeInTheDocument();
  });
});
