import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import { TIERS } from "ranked";
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

describe("AuraGalleryPage", () => {
  test.each(TIERS)("shows %s as an Ornament at every avatar size and as a Blason", async (tier) => {
    await renderPage();

    const row = screen.getByRole("region", { name: `Aura légère de ${tier}` });

    // From the Friends' 64 px box up to the Face-off's 352 px one.
    expect(ornaments(row)).toEqual(Array(6).fill(`#tier-ornament-${tier}`));
    // The Blason of the large Tier badge, then of the Tier-up celebration.
    expect(blasons(row)).toEqual(Array(2).fill(`#tier-emblem-${tier}`));
  });

  test("draws the full Aura of Or wherever the app shows it large", async () => {
    const browser = fakeAuraRuntime();

    await renderPage(browser.runtime);
    await waitFor(() => expect(browser.painters).toHaveLength(5));

    const full = screen.getByRole("region", { name: "Aura pleine de or" });

    // The Profile, the Match proposal and the Queue, the Face-off, then both Blasons.
    expect(browser.painters.every((painter) => full.contains(painter.canvas))).toBe(true);
    expect(browser.painters.map((painter) => painter.tier)).toEqual(Array(5).fill("or"));
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
