import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import type { FaceOffSounds } from "@/audio/face-off-sounds";
import { ReceivedChallengeCard } from "@/components/challenge/received-challenge-card";
import { DuelEnded } from "@/components/duel/duel-ended";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { PlaySetting } from "@/components/settings/play-setting";
import { usePlayStore } from "@/stores/play-store";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
};

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

beforeEach(() => {
  usePlayStore.setState(usePlayStore.getInitialState());
});

// Renders `ui` for Ada, on sounds that count their unlocks: browsers only let audio start from a
// click, and a Duel found is not one.
const renderWithSounds = (ui: ReactNode) => {
  const unlocks = { count: 0 };

  const sounds: FaceOffSounds = {
    unlock: () => {
      unlocks.count++;
    },
    play: () => {},
  };

  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  render(
    <QueryClientProvider client={queryClient}>
      <FaceOffSoundsContext value={sounds}>{ui}</FaceOffSoundsContext>
    </QueryClientProvider>,
  );

  return unlocks;
};

describe("the Face-off's sound, unlocked by the click that leads to it", () => {
  test("choosing Duel, which searches for an opponent", async () => {
    const unlocks = renderWithSounds(<PlaySetting />);

    await userEvent.click(screen.getByRole("button", { name: "duel" }));

    expect(unlocks.count).toBe(1);
  });

  test("Nouveau Duel, after a Duel", async () => {
    const unlocks = renderWithSounds(
      <DuelEnded
        ending={{
          ranked: null,
          duelId: null,
          outcome: "draw",
          forfeit: false,
          result: noResult,
          opponentResult: noResult,
          score: noScore,
          opponentScore: noScore,
          opponent: { handle: "alan", image: null },
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Nouveau Duel" }));

    expect(unlocks.count).toBe(1);
  });

  test("accepting a Challenge", async () => {
    const unlocks = renderWithSounds(
      <ul>
        <ReceivedChallengeCard
          challenge={{
            id: "challenge-1",
            from: { id: "alan-id", handle: "alan", image: null },
            expiresAt: Date.now() + 30_000,
          }}
        />
      </ul>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Refuser" }));
    expect(unlocks.count).toBe(0);

    await userEvent.click(screen.getByRole("button", { name: "Accepter" }));
    expect(unlocks.count).toBe(1);
  });
});
