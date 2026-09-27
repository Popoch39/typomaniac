import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Tier, TIERS } from "ranked";
import { describe, expect, test } from "vitest";

import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import type { AuraRuntime } from "@/lib/aura-runtime";
import { AuraGalleryPage } from "@/pages/aura-gallery-page";
import { fakeAuraRuntime } from "@/test/fake-aura-runtime";

const renderPage = async (runtime: AuraRuntime = fakeAuraRuntime().runtime) => {
  const rootRoute = createRootRoute();

  const galleryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dev/aura",
    component: AuraGalleryPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([galleryRoute]),
    history: createMemoryHistory({ initialEntries: ["/dev/aura"] }),
  });

  render(
    <AuraRuntimeContext value={runtime}>
      <RouterProvider router={router} />
    </AuraRuntimeContext>,
  );

  await screen.findByRole("heading", { level: 1 });
};

// The Tiers of the Ornaments and of the Blasons drawn inside `element`, in order.
const ornaments = (element: HTMLElement) =>
  [...element.querySelectorAll('[data-ornament] use[href^="#tier-ornament-"]')].map((use) =>
    use.getAttribute("href"),
  );

const blasons = (element: HTMLElement) =>
  [...element.querySelectorAll("[data-tier-blason] > use")].map((use) => use.getAttribute("href"));

// The full Auras drawn and still held, by Tier.
const held = (browser: ReturnType<typeof fakeAuraRuntime>) =>
  browser.painters.flatMap((painter) => (painter.disposed ? [] : [painter.tier]));

// The "Aura pleine" button of a Tier's card.
const fullToggle = (tier: Tier) =>
  within(screen.getByRole("region", { name: `Tier ${tier}` })).getByRole("button", {
    name: "Aura pleine",
  });

describe("AuraGalleryPage", () => {
  test.each(TIERS)("shows %s as an Ornament at every avatar size and as a Blason", async (tier) => {
    await renderPage();

    const row = screen.getByRole("region", { name: `Aura légère de ${tier}` });

    // From the Friends' 64 px box up to the Face-off's 352 px one.
    expect(ornaments(row)).toEqual(Array(6).fill(`#tier-ornament-${tier}`));
    // The Blason of the large Tier badge, then of the Tier-up celebration.
    expect(blasons(row)).toEqual(Array(2).fill(`#tier-emblem-${tier}`));
  });

  test("draws the full Aura of the highest Tier with one at first, and of no other", async () => {
    const browser = fakeAuraRuntime();

    await renderPage(browser.runtime);
    await waitFor(() => expect(browser.painters).toHaveLength(5));

    const full = screen.getByRole("region", { name: "Aura pleine de maniac" });

    // The Profile, the Match proposal and the Queue, the Face-off, then both Blasons.
    expect(held(browser)).toEqual(Array(5).fill("maniac"));
    expect(browser.painters.every((painter) => full.contains(painter.canvas))).toBe(true);
    expect(fullToggle("maniac")).toHaveAttribute("aria-pressed", "true");
    expect(fullToggle("or")).toHaveAttribute("aria-pressed", "false");
    expect(fullToggle("platine")).toHaveAttribute("aria-pressed", "false");
    expect(fullToggle("diamant")).toHaveAttribute("aria-pressed", "false");
  });

  test.each(["or", "platine", "diamant"] as const)(
    "shows the full Aura of %s in place of the one shown, whole, within the cap",
    async (tier) => {
      const browser = fakeAuraRuntime();

      await renderPage(browser.runtime);
      await waitFor(() => expect(browser.painters).toHaveLength(5));

      await userEvent.click(fullToggle(tier));
      await waitFor(() => expect(held(browser)).toEqual(Array(5).fill(tier)));

      const full = screen.getByRole("region", { name: `Aura pleine de ${tier}` });

      expect(
        browser.painters.every((painter) => painter.disposed || full.contains(painter.canvas)),
      ).toBe(true);
      expect(screen.queryByRole("region", { name: "Aura pleine de maniac" })).toBeNull();
      expect(fullToggle(tier)).toHaveAttribute("aria-pressed", "true");
      expect(fullToggle("maniac")).toHaveAttribute("aria-pressed", "false");
    },
  );

  test("hides the full Aura shown when its button is pressed again", async () => {
    const browser = fakeAuraRuntime();

    await renderPage(browser.runtime);
    await waitFor(() => expect(browser.painters).toHaveLength(5));

    await userEvent.click(fullToggle("maniac"));

    expect(held(browser)).toEqual([]);
    expect(screen.queryByRole("region", { name: "Aura pleine de maniac" })).toBeNull();
    expect(fullToggle("maniac")).toHaveAttribute("aria-pressed", "false");
  });

  test("offers no full Aura for a Tier without one", async () => {
    await renderPage();

    const card = screen.getByRole("region", { name: "Tier argent" });

    expect(within(card).queryByRole("button", { name: "Aura pleine" })).toBeNull();
  });

  test("lists a hundred fake Users wearing every Tier's Ornament", async () => {
    await renderPage();

    const list = screen.getByRole("list", { name: "Faux Classement" });
    const worn = new Set(ornaments(list));

    expect(within(list).getAllByRole("listitem")).toHaveLength(100);
    expect(worn).toEqual(new Set(TIERS.map((tier) => `#tier-ornament-${tier}`)));
  });

  test("keeps a frame-rate counter on screen", async () => {
    await renderPage();

    expect(screen.getByRole("status", { name: "Images par seconde" })).toHaveTextContent("fps");
  });
});
