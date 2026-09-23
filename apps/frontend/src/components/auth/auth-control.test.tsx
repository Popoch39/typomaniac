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
    renderWithSession({ id: "u1", name: "Ada Lovelace", email: "ada@example.com", image: null });

    expect(screen.getByRole("button", { name: "Menu de Ada Lovelace" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Se connecter" })).not.toBeInTheDocument();
  });
});
