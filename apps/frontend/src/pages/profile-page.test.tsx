import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { type Profile, profileQueryOptions } from "@/api/profile";
import { ProfilePage } from "@/pages/profile-page";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
};

const profile = (stats: Partial<Profile["stats"]>): Profile => ({
  handle: "ada",
  image: null,
  stats: {
    duels: 0,
    record: { wins: 0, losses: 0, draws: 0 },
    averages: { wpm: null, accuracy: null },
    records: { wpm: null, score: null, combo: null },
    ...stats,
  },
});

// The page with the User and their Profile in the cache, the way the route's loader leaves them.
const renderPage = async (user: Me, own: Profile | null) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, user);

  if (own !== null) {
    queryClient.setQueryData(profileQueryOptions(own.handle).queryKey, own);
  }

  render(
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <ProfilePage />
      </Suspense>
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { name: "Profil" });
};

const tile = (list: string, term: string) => {
  const found = within(screen.getByLabelText(list)).getByText(term).closest("div");

  if (found === null) {
    throw new Error(`No tile ${term}`);
  }

  return found;
};

describe("ProfilePage", () => {
  test("shows the User's Stats: their tiles and their record", async () => {
    await renderPage(
      me,
      profile({
        duels: 4,
        record: { wins: 2, losses: 1, draws: 1 },
        averages: { wpm: 62.4, accuracy: 96.6 },
        records: { wpm: 90, score: 1234, combo: null },
      }),
    );

    expect(tile("Stats", "Duels")).toHaveTextContent("4");
    expect(tile("Stats", "wpm moyen")).toHaveTextContent("62");
    expect(tile("Stats", "meilleur wpm")).toHaveTextContent("90");
    expect(tile("Stats", "accuracy moyenne")).toHaveTextContent("97 %");
    expect(tile("Stats", "meilleur Score")).toHaveTextContent("1234");
    expect(tile("Stats", "meilleur Combo")).toHaveTextContent("–");
    expect(tile("Bilan", "victoires")).toHaveTextContent("2");
    expect(tile("Bilan", "défaites")).toHaveTextContent("1");
    expect(tile("Bilan", "Draws")).toHaveTextContent("1");
    expect(tile("Bilan", "taux de victoire")).toHaveTextContent("50 %");
  });

  test("invites a User without a Duel to play", async () => {
    await renderPage(me, profile({}));

    expect(screen.getByText(/joue ton premier/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Stats")).not.toBeInTheDocument();
  });

  test("a User without a Handle has no Stats", async () => {
    await renderPage({ ...me, handle: null }, null);

    expect(screen.queryByRole("heading", { name: "Stats" })).not.toBeInTheDocument();
  });
});
