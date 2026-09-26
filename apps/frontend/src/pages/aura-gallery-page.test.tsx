import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { TIERS } from "ranked";
import { describe, expect, test } from "vitest";

import { AuraGalleryPage } from "@/pages/aura-gallery-page";

const renderPage = async () => {
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

  render(<RouterProvider router={router} />);

  await screen.findByRole("heading", { level: 1 });
};

// The Tiers of the Ornaments and of the Blasons drawn inside `element`, in order.
const ornaments = (element: HTMLElement) =>
  [...element.querySelectorAll("[data-ornament] use")].map((use) => use.getAttribute("href"));

const blasons = (element: HTMLElement) =>
  [...element.querySelectorAll("[data-tier-blason] > use")].map((use) => use.getAttribute("href"));

describe("AuraGalleryPage", () => {
  test.each(TIERS)("shows %s as an Ornament at every avatar size and as a Blason", async (tier) => {
    await renderPage();

    const row = screen.getByRole("region", { name: `Tier ${tier}` });

    // From the Friends' 64 px box up to the Face-off's 352 px one.
    expect(ornaments(row)).toEqual(Array(6).fill(`#tier-ornament-${tier}`));
    // The Blason of the large Tier badge, then of the Tier-up celebration.
    expect(blasons(row)).toEqual(Array(2).fill(`#tier-emblem-${tier}`));
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
