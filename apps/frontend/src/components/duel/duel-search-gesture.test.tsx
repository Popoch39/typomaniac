import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { DuelHandleRequired } from "@/components/duel/duel-handle-required";
import { TabAttentionContext } from "@/components/tab-attention/tab-attention-context";
import { PlaySetting } from "@/components/settings/play-setting";
import { quietTabAttention, type NotificationAccess } from "@/lib/tab-attention";
import { usePlayStore } from "@/stores/play-store";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
};

beforeEach(() => {
  usePlayStore.setState(usePlayStore.getInitialState());
});

// Renders `ui` for Ada, in a tab whose notification permission is `permission`: counts how often
// it is asked for.
const renderWithPermission = (ui: React.ReactNode, permission: NotificationAccess) => {
  const requests = { count: 0 };
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  render(
    <QueryClientProvider client={queryClient}>
      <TabAttentionContext
        value={{
          ...quietTabAttention,
          permission: () => permission,
          requestPermission: () => {
            requests.count++;
          },
        }}
      >
        {ui}
      </TabAttentionContext>
    </QueryClientProvider>,
  );

  return requests;
};

describe("the notification permission, asked on the click that searches for a Duel", () => {
  test("Chercher un Duel asks it when never asked", async () => {
    const requests = renderWithPermission(<DuelHandleRequired />, "default");

    await userEvent.click(screen.getByRole("button", { name: "Chercher un Duel" }));

    expect(requests.count).toBe(1);
  });

  test("choosing Duel asks it too", async () => {
    const requests = renderWithPermission(<PlaySetting />, "default");

    await userEvent.click(screen.getByRole("button", { name: "duel" }));

    expect(requests.count).toBe(1);
  });

  test.each(["granted", "denied", "unsupported"] as const)(
    "never asks it again once %s",
    async (permission) => {
      const requests = renderWithPermission(<DuelHandleRequired />, permission);

      await userEvent.click(screen.getByRole("button", { name: "Chercher un Duel" }));

      expect(requests.count).toBe(0);
    },
  );
});
