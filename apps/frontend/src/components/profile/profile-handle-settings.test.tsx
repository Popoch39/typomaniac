import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type HandleAvailability, handleAvailabilityQueryOptions } from "@/api/handle";
import { type Me, meQueryOptions } from "@/api/me";
import { ProfileHandleSettings } from "@/components/profile/profile-handle-settings";
import { Toaster } from "@/components/ui/sonner";
import { useLocaleStore } from "@/stores/locale-store";

const ada: Me = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
  place: null,
};

beforeEach(() => {
  useLocaleStore.setState({ locale: "en" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Ada's settings, with "grace" free as far as the cached live check knows.
const renderSettings = () => {
  const queryClient = new QueryClient();
  const free: HandleAvailability = { available: true, handle: "grace" };

  queryClient.setQueryData(meQueryOptions.queryKey, ada);
  queryClient.setQueryData(handleAvailabilityQueryOptions(free.handle).queryKey, free);

  render(
    <QueryClientProvider client={queryClient}>
      <ProfileHandleSettings me={ada} />
      <Toaster />
    </QueryClientProvider>,
  );

  return userEvent.setup();
};

const field = () => screen.getByRole("textbox", { name: "Handle" });

describe("ProfileHandleSettings in English", () => {
  test("says the Handle is the current one, and what changing it does", () => {
    renderSettings();

    expect(field()).toHaveValue("ada");
    expect(screen.getByText("That's your current Handle.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByText(
        "Changing your Handle frees the old one right away. Your Duel history stays with you.",
      ),
    ).toBeInTheDocument();
  });

  test("says the Handle is saved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ...ada, handle: "grace" })),
    );

    const user = renderSettings();

    await user.clear(field());
    await user.type(field(), "grace");
    await screen.findByText("Available.");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Handle saved")).toBeInTheDocument();
  });

  test("says when saving fails for no reason given", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ message: "down" }, { status: 500 })),
    );

    const user = renderSettings();

    await user.clear(field());
    await user.type(field(), "grace");
    await screen.findByText("Available.");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save. Try again.");
  });
});
