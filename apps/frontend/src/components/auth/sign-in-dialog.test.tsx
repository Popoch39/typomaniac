import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useLocaleStore } from "@/stores/locale-store";

beforeEach(() => {
  useAuthStore.setState({ ...useAuthStore.getInitialState(), signInOpen: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderDialog = () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SignInDialog />
      <Toaster />
    </QueryClientProvider>,
  );

  return userEvent.setup();
};

describe("SignInDialog", () => {
  test("offers the three providers, and says what typomaniac keeps", () => {
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Se connecter" })).toHaveAccessibleDescription(
      "Tes scores et ta progression te suivent d'un appareil à l'autre.",
    );

    for (const provider of ["GitHub", "Google", "Discord"]) {
      expect(screen.getByRole("button", { name: `Continuer avec ${provider}` })).toBeEnabled();
    }

    expect(
      screen.getByText("typomaniac ne récupère que ton nom, ton email et ton avatar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });
});

describe("SignInDialog in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test("offers the three providers, and says what typomaniac keeps", () => {
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Sign in" })).toHaveAccessibleDescription(
      "Your scores and progress follow you from one device to the next.",
    );

    for (const provider of ["GitHub", "Google", "Discord"]) {
      expect(screen.getByRole("button", { name: `Continue with ${provider}` })).toBeEnabled();
    }

    expect(
      screen.getByText("typomaniac only gets your name, email and avatar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  test("says when the sign-in cannot start", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ message: "down" }, { status: 500 })),
    );

    const user = renderDialog();

    await user.click(screen.getByRole("button", { name: "Continue with GitHub" }));

    expect(await screen.findByText("Sign-in couldn't start. Try again.")).toBeInTheDocument();
  });
});
