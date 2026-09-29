import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { ApiError } from "@/api/client";
import { healthQueryOptions } from "@/api/health";
import { HealthError, HealthPage } from "@/pages/health-page";
import { useLocaleStore } from "@/stores/locale-store";

// The API's answer when it is up, already read through Query.
const renderHealth = () => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(healthQueryOptions.queryKey, { status: "ok" });
  render(
    <QueryClientProvider client={queryClient}>
      <HealthPage />
    </QueryClientProvider>,
  );
};

const unreachable = new ApiError(503, {
  error: { code: "INTERNAL_ERROR", message: "down", requestId: "req-42" },
});

const renderError = () =>
  render(<HealthError error={unreachable} reset={() => undefined} info={undefined} />);

describe("the API's health", () => {
  test("tells the API's status", () => {
    renderHealth();

    expect(screen.getByRole("heading", { level: 1, name: "Santé de l'API" })).toBeInTheDocument();
    expect(screen.getByText("ok").parentElement).toHaveTextContent("Statut : ok");
  });

  test("says the API is unreachable, with the request's reference and a retry", () => {
    renderError();

    expect(screen.getByRole("heading", { level: 1, name: "API injoignable" })).toBeInTheDocument();
    expect(screen.getByText("La vérification de l'API a échoué.")).toBeInTheDocument();
    expect(screen.getByText("req-42").parentElement).toHaveTextContent("Référence : req-42");
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("tells the API's status", () => {
      renderHealth();

      expect(screen.getByRole("heading", { level: 1, name: "API health" })).toBeInTheDocument();
      expect(screen.getByText("ok").parentElement).toHaveTextContent("Status: ok");
    });

    test("says the API is unreachable, with the request's reference and a retry", () => {
      renderError();

      expect(
        screen.getByRole("heading", { level: 1, name: "API unreachable" }),
      ).toBeInTheDocument();
      expect(screen.getByText("The API check failed.")).toBeInTheDocument();
      expect(screen.getByText("req-42").parentElement).toHaveTextContent("Reference: req-42");
      expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    });
  });
});
