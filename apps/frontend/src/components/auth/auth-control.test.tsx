import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { meQueryOptions, type Me } from "@/api/me";
import { AuthControl } from "@/components/auth/auth-control";

// The cache is seeded the way the root route's beforeLoad leaves it: no request is made.
const renderWithSession = (me: Me | null) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthControl />
    </QueryClientProvider>,
  );
};

describe("AuthControl", () => {
  test("a Visitor is offered to sign in", () => {
    renderWithSession(null);

    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  test("a signed-in User gets their menu instead", () => {
    renderWithSession({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: null,
      handle: "ada",
      rank: null,
    });

    expect(screen.getByRole("button", { name: "Menu de Ada Lovelace" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Se connecter" })).not.toBeInTheDocument();
  });

  test("the User chip's avatar falls back on the initials of the Handle, as everywhere else", () => {
    renderWithSession({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: null,
      handle: "alan turing",
      rank: null,
    });

    expect(screen.getByText("AT")).toBeInTheDocument();
    expect(screen.queryByText("AL")).not.toBeInTheDocument();
  });

  test("the User chip's avatar falls back on the initials of the name until a Handle is chosen", () => {
    renderWithSession({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: null,
      handle: null,
      rank: null,
    });

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  test("the User chip shows the User's Tier and Division", () => {
    renderWithSession({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: null,
      handle: "ada",
      rank: { tier: "platine", division: 3, tp: 10, shielded: false },
    });

    expect(screen.getByRole("button", { name: "Menu de Ada Lovelace" })).toHaveTextContent(
      "Platine III · 10 TP",
    );
  });

  test("the User chip shows a User in Placement as such", () => {
    renderWithSession({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: null,
      handle: "ada",
      rank: { placementsLeft: 2 },
    });

    expect(screen.getByRole("button", { name: "Menu de Ada Lovelace" })).toHaveTextContent(
      "Placement · 2 Duels restants",
    );
  });
});
