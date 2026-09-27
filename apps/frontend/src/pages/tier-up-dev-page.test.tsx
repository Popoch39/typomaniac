import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { FaceOffSound, FaceOffSounds } from "@/audio/face-off-sounds";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { TierUpDevPage } from "@/pages/tier-up-dev-page";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";
import { holdGsapClock } from "@/test/gsap-clock";

// What the page played, and how often it unlocked the sound.
let played: FaceOffSound[] = [];

let unlocks = 0;

const sounds: FaceOffSounds = {
  unlock: () => {
    unlocks += 1;
  },
  play: (sound) => {
    played.push(sound);
  },
};

let clock = holdGsapClock();

beforeEach(() => {
  played = [];
  unlocks = 0;
  useFaceOffSoundStore.setState({ muted: false });
  clock = holdGsapClock();
});

afterEach(() => clock.release());

const renderPage = async () => {
  const rootRoute = createRootRoute();

  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dev/rankup",
    component: TierUpDevPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: ["/dev/rankup"] }),
  });

  render(
    <FaceOffSoundsContext value={sounds}>
      <RouterProvider router={router} />
    </FaceOffSoundsContext>,
  );

  await screen.findByRole("heading", { level: 1, name: "Tier-up" });
};

const rise = (name: string) =>
  within(screen.getByRole("list", { name: "Tier-ups" })).getByRole("button", { name });

const continueButton = () => screen.getByRole("button", { name: "Continuer" });

describe("TierUpDevPage", () => {
  test("lists the six Tier-ups, from Fer to Maniac", async () => {
    await renderPage();

    const tierUps = within(screen.getByRole("list", { name: "Tier-ups" })).getAllByRole("button");

    expect(tierUps.map((each) => each.textContent)).toEqual([
      "Fer I → Bronze IV",
      "Bronze I → Argent IV",
      "Argent I → Or IV",
      "Or I → Platine IV",
      "Platine I → Diamant IV",
      "Diamant I → Maniac",
    ]);
  });

  test.each([
    ["Fer I → Bronze IV", "Bronze"],
    ["Argent I → Or IV", "Or"],
    ["Diamant I → Maniac", "Maniac"],
  ])("choosing %s opens the Tier-up of %s, its sound unlocked", async (name, tier) => {
    await renderPage();

    await userEvent.click(rise(name));

    expect(screen.getByRole("dialog", { name: tier })).toHaveTextContent(name);
    expect(unlocks).toBe(1);
  });

  test("replays the last Tier-up from its start, sounds included", async () => {
    await renderPage();

    expect(screen.getByRole("button", { name: "Rejouer" })).toBeDisabled();

    await userEvent.click(rise("Fer I → Bronze IV"));
    await clock.advance(1.1);
    await userEvent.click(continueButton());
    await userEvent.click(screen.getByRole("button", { name: "Rejouer" }));
    await clock.advance(1.1);

    expect(screen.getByRole("dialog", { name: "Bronze" })).toBeInTheDocument();
    expect(played).toEqual(["tier-up-bronze-dissolve", "tier-up-bronze-dissolve"]);
  });

  test("forces reduced motion: the Tier-up opens at its end, with its impact alone", async () => {
    await renderPage();

    await userEvent.click(screen.getByRole("checkbox", { name: "Animations réduites" }));
    await userEvent.click(rise("Fer I → Bronze IV"));

    await waitFor(() => expect(continueButton()).toHaveFocus());
    await clock.advance(5);
    expect(played).toEqual(["tier-up-bronze-impact"]);
  });

  test("mutes the Tier-up", async () => {
    await renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Couper le son" }));
    await userEvent.click(rise("Fer I → Bronze IV"));
    await clock.advance(5);

    expect(screen.getByRole("button", { name: "Couper le son", hidden: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(played).toEqual([]);
  });

  test("keeps a frame-rate counter on screen", async () => {
    await renderPage();

    expect(screen.getByRole("status", { name: "Images par seconde" })).toHaveTextContent("fps");
  });
});
