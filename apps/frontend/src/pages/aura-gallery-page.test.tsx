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

  test("draws the full Aura of Or, then Platine's, wherever the app shows it large", async () => {
    const browser = fakeAuraRuntime();

    await renderPage(browser.runtime);
    // Shown at first, within the cap of 8: Or's five, then the first three of Platine.
    await waitFor(() => expect(browser.painters).toHaveLength(8));

    const fullOr = screen.getByRole("region", { name: "Aura pleine de or" });

    const orToggle = fullToggle("or");

    // The Profile, the Match proposal and the Queue, the Face-off, then both Blasons.
    expect(orToggle).toHaveAttribute("aria-pressed", "true");
    expect(held(browser)).toEqual([...Array(5).fill("or"), ...Array(3).fill("platine")]);
    expect(browser.painters.slice(0, 5).every((painter) => fullOr.contains(painter.canvas))).toBe(
      true,
    );

    // Hiding Or gives its places back: shown again, Platine's whole row is full (a light Aura
    // never asks twice, so its row is hidden and shown).
    const platineToggle = fullToggle("platine");

    await userEvent.click(orToggle);
    await userEvent.click(platineToggle);
    await userEvent.click(platineToggle);
    await waitFor(() => expect(held(browser)).toEqual(Array(5).fill("platine")));

    const fullPlatine = screen.getByRole("region", { name: "Aura pleine de platine" });

    expect(orToggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("region", { name: "Aura pleine de or" })).toBeNull();
    expect(
      browser.painters.every((painter) => painter.disposed || fullPlatine.contains(painter.canvas)),
    ).toBe(true);
  });

  test("draws the full Aura of Diamant once Or and Platine give their places back", async () => {
    const browser = fakeAuraRuntime();

    await renderPage(browser.runtime);
    await waitFor(() => expect(browser.painters).toHaveLength(8));

    // Past the cap of 8 at first, so light; shown again once the others are hidden.
    await userEvent.click(fullToggle("or"));
    await userEvent.click(fullToggle("platine"));
    await userEvent.click(fullToggle("diamant"));
    await userEvent.click(fullToggle("diamant"));
    await waitFor(() => expect(held(browser)).toEqual(Array(5).fill("diamant")));

    const fullDiamant = screen.getByRole("region", { name: "Aura pleine de diamant" });

    expect(
      browser.painters.every((painter) => painter.disposed || fullDiamant.contains(painter.canvas)),
    ).toBe(true);
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
