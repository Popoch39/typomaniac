import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { DuelHandleRequired } from "@/components/duel/duel-handle-required";
import { useLocaleStore } from "@/stores/locale-store";

const ada: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: null,
  rank: null,
  ornament: null,
  ornamentChoice: null,
  place: null,
};

beforeEach(() => {
  useLocaleStore.setState({ locale: "en" });
});

const renderGate = (me: Me) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  render(
    <QueryClientProvider client={queryClient}>
      <DuelHandleRequired />
    </QueryClientProvider>,
  );
};

describe("DuelHandleRequired in English", () => {
  test("asks a User without a Handle to choose one before a Duel", () => {
    renderGate(ada);

    expect(screen.getByRole("status")).toHaveTextContent(
      "In a Duel, your opponent sees your Handle: choose one to play. You can still play solo Runs without one.",
    );
    expect(screen.getByRole("button", { name: "Choose my Handle" })).toBeInTheDocument();
  });

  test("once chosen, shows the Handle the opponent will see, and searches again", () => {
    renderGate({ ...ada, handle: "ada" });

    expect(screen.getByRole("status")).toHaveTextContent("Your opponent will see you as @ada.");
    expect(screen.getByRole("button", { name: "Find a Duel" })).toBeInTheDocument();
  });
});
