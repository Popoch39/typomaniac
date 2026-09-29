import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { OrnamentPicker } from "@/components/ornament/ornament-picker";
import { Toaster } from "@/components/ui/sonner";
import { useLocaleStore } from "@/stores/locale-store";

const ada: Me = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: { tier: "gold", division: 2, tp: 42, shielded: false },
  ornament: "gold",
  ornamentChoice: "follow",
};

beforeEach(() => {
  useLocaleStore.setState({ locale: "en" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderPicker = (me: Me) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);

  render(
    <QueryClientProvider client={queryClient}>
      <OrnamentPicker me={me} handle="ada" />
      <Toaster />
    </QueryClientProvider>,
  );

  return userEvent.setup();
};

const picker = () => screen.getByRole("group", { name: "Ornament" });

describe("OrnamentPicker in English", () => {
  test("names its options, and how the locked ones open up", () => {
    renderPicker(ada);

    expect(within(picker()).getByRole("radio", { name: "Follow my Tier" })).toBeChecked();
    expect(within(picker()).getByRole("radio", { name: "None" })).toBeEnabled();
    expect(within(picker()).getByRole("radio", { name: "Platinum" })).toBeDisabled();
    expect(picker()).toHaveAccessibleDescription(
      "Ornaments from the Tiers above yours unlock as you reach them.",
    );
  });

  test("in Placement, asks to finish it", () => {
    renderPicker({ ...ada, rank: { placementsLeft: 3 } });

    expect(picker()).toHaveAccessibleDescription("Finish your Placement");
  });

  test("says when the Ornament could not be changed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );

    const user = renderPicker(ada);

    await user.click(within(picker()).getByRole("radio", { name: "None" }));

    expect(
      await screen.findByText("Couldn't change your Ornament. Try again."),
    ).toBeInTheDocument();
  });
});
