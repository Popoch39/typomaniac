import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { type HandleAvailability, handleAvailabilityQueryOptions } from "@/api/handle";
import { type Me, meQueryOptions } from "@/api/me";
import { HandleChoiceDialog } from "@/components/handle/handle-choice-dialog";
import { useAuthStore } from "@/stores/auth-store";

const ada: Me = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  handle: null,
  rank: null,
};

beforeEach(() => {
  useAuthStore.setState(useAuthStore.getInitialState());
});

// The Session as the root route leaves it, and what the API would answer for these Handles: the
// live check reads them from the cache, no request is made.
const renderDialog = (me: Me | null, taken: readonly string[] = []) => {
  const queryClient = new QueryClient();
  const free: HandleAvailability = { available: true, handle: "ada_lovelace" };
  const refused: HandleAvailability = { available: false, reason: "taken" };

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(handleAvailabilityQueryOptions(free.handle).queryKey, free);

  for (const handle of taken) {
    queryClient.setQueryData(handleAvailabilityQueryOptions(handle).queryKey, refused);
  }

  render(
    <QueryClientProvider client={queryClient}>
      <HandleChoiceDialog />
    </QueryClientProvider>,
  );

  return userEvent.setup();
};

const field = () => screen.getByRole("textbox", { name: "Handle" });

describe("HandleChoiceDialog", () => {
  test("asks a User without a Handle for one, starting from their name", async () => {
    renderDialog(ada);

    expect(screen.getByRole("dialog", { name: "Choisis ton Handle" })).toBeInTheDocument();
    expect(field()).toHaveValue("ada_lovelace");
    expect(await screen.findByText("Disponible.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C'est parti" })).toBeEnabled();
  });

  test("tells at once why a Handle is invalid, without asking the API", async () => {
    const user = renderDialog(ada);

    await user.clear(field());
    await user.type(field(), "ada!");

    expect(screen.getByText("Seulement des lettres a-z, des chiffres et _.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C'est parti" })).toBeDisabled();

    await user.clear(field());
    await user.type(field(), "ad");

    expect(screen.getByText("3 caractères minimum.")).toBeInTheDocument();
  });

  test("tells a taken Handle once the User pauses", async () => {
    const user = renderDialog(ada, ["grace"]);

    await user.clear(field());
    await user.type(field(), "Grace");

    expect(await screen.findByText("Ce Handle est déjà pris.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C'est parti" })).toBeDisabled();
  });

  test("Plus tard puts the choice off", async () => {
    const user = renderDialog(ada);

    await user.click(screen.getByRole("button", { name: "Plus tard" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("is not shown to a User who has a Handle, nor to a Visitor", () => {
    renderDialog({ ...ada, handle: "ada" });
    renderDialog(null);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
