import { act, cleanup, screen, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import { gsap } from "gsap";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  ACCENT_SECONDS,
  CONTENT_IN_AT,
  CONTENT_IN_SECONDS,
  CONTENT_OUT_SECONDS,
  PILL_CANCEL_SECONDS,
} from "@/components/search-morph/search-morph-timing";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { useSettingsStore } from "@/stores/settings-store";
import { fakeServer, idle } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, renderAppFor } from "@/test/render-app";

// The search's animations, board « L'animation, pas à pas »: launching it, folding it into the
// Queue pill and back, Annuler from the pill, the Match proposal's accent, the ring turning. Each
// reaches the state it has without them, and at once under reduced motion.

// The whole of a morph: the leaving form fades out, the arriving one's content fades in last.
const MORPH_END = CONTENT_IN_AT + CONTENT_IN_SECONDS;

// Ada against kzr_: 10 s to answer.
const matchProposed: ServerMessage = {
  type: "match-proposed",
  expiresAt: 30_000,
  serverTime: 20_000,
  opponent: { handle: "kzr_", image: null, ornament: null },
  selfOrnament: null,
  selfRank: { tier: "gold", division: 2, tp: 64, shielded: false },
  opponentRank: { placementsLeft: 3 },
  selfAccepted: false,
  opponentAccepted: false,
  dodgeLock: null,
};

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the stores outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

const sent = () => server().sentOfPlace();

const sidebarLink = (name: string) =>
  within(screen.getByRole("complementary", { name: "Barre latérale" })).getByRole("link", {
    name,
  });

const pill = () => screen.getByRole("region", { name: "Recherche en cours" });

const queryPill = () => screen.queryByRole("region", { name: "Recherche en cours" });

const searchHeading = () => screen.getByRole("heading", { name: "On te trouve un adversaire…" });

const searchCard = () => searchHeading().closest("section");

// What fades in the Queue pill: its title and wait, its buttons.
const pillContent = () => within(pill()).getByRole("button", { name: "Agrandir la recherche" });

// What fades in the search's card: its title and format.
const cardContent = () => searchHeading().parentElement;

// The search's surface and ring, moved from one form to the other.
const surfaceOf = (form: HTMLElement | null) => form?.querySelector("[data-search-surface]");

const ringOf = (form: HTMLElement | null) => form?.querySelector("[data-search-ring]");

// The accent the Match proposal brings to the search.
const accentOf = (name: string) =>
  screen.getByRole("region", { name }).querySelector<HTMLElement>("[data-search-accent]");

// The copies of what leaves, fading out where it was.
const ghosts = () => [...document.querySelectorAll<HTMLElement>("[data-search-ghost]")];

const opacityOf = (element: HTMLElement | null | undefined) => Number(element?.style.opacity);

const styleOf = (element: Element | null | undefined) => element?.getAttribute("style");

// Ada on Jouer, then in the Queue, every animation of the way over.
const renderQueue = async () => {
  const app = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

  receive(idle());
  await app.user.click(screen.getByRole("button", { name: "Lancer la recherche" }));
  receive({ type: "queued" });
  gsapClock.advance(MORPH_END);

  return app;
};

// The same, the search folded into the Queue pill on Friends.
const renderPill = async () => {
  const app = await renderQueue();

  await app.user.click(sidebarLink("Friends"));
  gsapClock.advance(MORPH_END);

  return app;
};

const reduceMotion = () =>
  vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
    matches: media === "(prefers-reduced-motion: reduce)",
    media,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }));

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  gsapClock = holdGsapClock();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

afterEach(() => {
  gsapClock.release();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useConnectionStore.getState().close();
  useDuelStore.setState(useDuelStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("launching the search", () => {
  test("Jouer's cards fade out, then the search's ring and content appear from 500 to 800 ms", async () => {
    const { user } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    await user.click(screen.getByRole("button", { name: "Lancer la recherche" }));

    // The title and the three cards.
    expect(ghosts()).toHaveLength(4);
    expect(styleOf(cardContent())).toContain("opacity: 0");
    expect(styleOf(ringOf(searchCard()))).toContain("opacity: 0");
    // Laid where the Ranked card was.
    expect(styleOf(surfaceOf(searchCard()))).toBeTruthy();

    gsapClock.advance(CONTENT_OUT_SECONDS);

    expect(ghosts()).toHaveLength(0);

    gsapClock.advance(CONTENT_IN_AT - CONTENT_OUT_SECONDS + CONTENT_IN_SECONDS / 2);

    expect(opacityOf(cardContent())).toBeGreaterThan(0);
    expect(opacityOf(cardContent())).toBeLessThan(1);

    gsapClock.advance(CONTENT_IN_SECONDS);

    expect(styleOf(cardContent())).toBeFalsy();
    expect(styleOf(ringOf(searchCard()))).toBeFalsy();
    expect(styleOf(surfaceOf(searchCard()))).toBeFalsy();
  });

  test("under reduced motion, the search is there at once", async () => {
    reduceMotion();

    const { user } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    await user.click(screen.getByRole("button", { name: "Lancer la recherche" }));

    expect(ghosts()).toHaveLength(0);
    expect(styleOf(cardContent())).toBeFalsy();
    expect(styleOf(surfaceOf(searchCard()))).toBeFalsy();
  });
});

describe("folding the search into the Queue pill", () => {
  test("the card's content fades out in 200 ms, the pill's fades in from 500 to 800 ms", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "S'entraîner" }));

    // The card and the tip under it.
    expect(ghosts()).toHaveLength(2);
    expect(pillContent().style.opacity).toBe("0");
    // The surface and the ring laid where the card's were.
    expect(styleOf(surfaceOf(pill()))).toBeTruthy();
    expect(styleOf(ringOf(pill()))).toBeTruthy();

    gsapClock.advance(CONTENT_OUT_SECONDS / 2);

    expect(opacityOf(ghosts()[0])).toBeGreaterThan(0);
    expect(opacityOf(ghosts()[0])).toBeLessThan(1);

    gsapClock.advance(CONTENT_IN_AT - CONTENT_OUT_SECONDS / 2 - 0.02);

    expect(ghosts()).toHaveLength(0);
    expect(pillContent().style.opacity).toBe("0");

    gsapClock.advance(CONTENT_IN_SECONDS / 2);

    expect(opacityOf(pillContent())).toBeGreaterThan(0);
    expect(opacityOf(pillContent())).toBeLessThan(1);

    gsapClock.advance(CONTENT_IN_SECONDS);

    expect(styleOf(pillContent())).toBeFalsy();
    expect(styleOf(surfaceOf(pill()))).toBeFalsy();
    expect(styleOf(ringOf(pill()))).toBeFalsy();
  });

  test("going to another page folds it the same way", async () => {
    const { user } = await renderQueue();

    await user.click(sidebarLink("Classement"));

    expect(ghosts()).toHaveLength(2);
    expect(pillContent().style.opacity).toBe("0");

    gsapClock.advance(MORPH_END);

    expect(ghosts()).toHaveLength(0);
    expect(styleOf(pillContent())).toBeFalsy();
  });

  test("under reduced motion, the pill takes the card's place at once", async () => {
    reduceMotion();

    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "S'entraîner" }));

    expect(ghosts()).toHaveLength(0);
    expect(styleOf(pillContent())).toBeFalsy();
    expect(styleOf(surfaceOf(pill()))).toBeFalsy();
  });
});

describe("Agrandir", () => {
  test("unfolds the pill into the card the other way: the pill's content fades out, the card's in", async () => {
    const { user } = await renderPill();

    await user.click(within(pill()).getByRole("button", { name: "Agrandir la recherche" }));

    expect(ghosts()).toHaveLength(1);
    expect(styleOf(cardContent())).toContain("opacity: 0");

    gsapClock.advance(CONTENT_OUT_SECONDS);

    expect(ghosts()).toHaveLength(0);

    gsapClock.advance(CONTENT_IN_AT - CONTENT_OUT_SECONDS + CONTENT_IN_SECONDS / 2);

    expect(opacityOf(cardContent())).toBeGreaterThan(0);
    expect(opacityOf(cardContent())).toBeLessThan(1);

    gsapClock.advance(CONTENT_IN_SECONDS);

    expect(styleOf(cardContent())).toBeFalsy();
    expect(styleOf(surfaceOf(searchCard()))).toBeFalsy();
    expect(styleOf(ringOf(searchCard()))).toBeFalsy();
  });

  test("halfway through folding, unfolds from where the pill is and ends as it would", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "S'entraîner" }));
    gsapClock.advance(CONTENT_IN_AT - 0.2);
    await user.click(within(pill()).getByRole("button", { name: "Agrandir la recherche" }));

    expect(queryPill()).not.toBeInTheDocument();
    expect(styleOf(cardContent())).toContain("opacity: 0");

    gsapClock.advance(MORPH_END);

    expect(ghosts()).toHaveLength(0);
    expect(styleOf(cardContent())).toBeFalsy();
    expect(styleOf(surfaceOf(searchCard()))).toBeFalsy();
  });

  test("under reduced motion, the card takes the pill's place at once", async () => {
    reduceMotion();

    const { user } = await renderPill();

    await user.click(within(pill()).getByRole("button", { name: "Agrandir la recherche" }));

    expect(ghosts()).toHaveLength(0);
    expect(styleOf(cardContent())).toBeFalsy();
  });
});

describe("Annuler from the Queue pill", () => {
  test("leaves the Queue at once, the pill fading out where it is in 220 ms", async () => {
    const { user } = await renderPill();

    await user.click(within(pill()).getByRole("button", { name: "Annuler la recherche" }));

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "leave-queue" }]);

    gsapClock.advance(PILL_CANCEL_SECONDS / 2);

    expect(opacityOf(pill())).toBeGreaterThan(0);
    expect(opacityOf(pill())).toBeLessThan(1);

    gsapClock.advance(PILL_CANCEL_SECONDS);

    expect(queryPill()).not.toBeInTheDocument();
  });

  test("halfway through folding, fades the pill out from how it stands", async () => {
    const { user } = await renderQueue();

    await user.click(screen.getByRole("button", { name: "S'entraîner" }));
    gsapClock.advance(CONTENT_IN_AT - 0.2);
    await user.click(within(pill()).getByRole("button", { name: "Annuler la recherche" }));
    gsapClock.advance(PILL_CANCEL_SECONDS / 2);

    expect(opacityOf(pill())).toBeGreaterThan(0);
    expect(opacityOf(pill())).toBeLessThan(1);

    gsapClock.advance(PILL_CANCEL_SECONDS);

    expect(queryPill()).not.toBeInTheDocument();
    expect(ghosts()).toHaveLength(0);
  });

  test("under reduced motion, the pill is gone at once", async () => {
    reduceMotion();

    const { user } = await renderPill();

    await user.click(within(pill()).getByRole("button", { name: "Annuler la recherche" }));

    expect(queryPill()).not.toBeInTheDocument();
  });
});

describe("the Match proposal's accent", () => {
  test("the Queue pill turns to the accent in a fade", async () => {
    await renderPill();

    receive(matchProposed);

    expect(styleOf(accentOf("Adversaire trouvé !"))).toContain("opacity: 0");

    gsapClock.advance(ACCENT_SECONDS / 2);

    expect(opacityOf(accentOf("Adversaire trouvé !"))).toBeGreaterThan(0);
    expect(opacityOf(accentOf("Adversaire trouvé !"))).toBeLessThan(1);

    gsapClock.advance(ACCENT_SECONDS);

    expect(styleOf(accentOf("Adversaire trouvé !"))).toBeFalsy();
  });

  test("the card takes its accent outline in a fade", async () => {
    await renderQueue();

    receive(matchProposed);

    expect(styleOf(accentOf("Adversaire trouvé !"))).toContain("opacity: 0");

    gsapClock.advance(ACCENT_SECONDS);

    expect(styleOf(accentOf("Adversaire trouvé !"))).toBeFalsy();
  });

  test("under reduced motion, the accent is there at once", async () => {
    reduceMotion();
    await renderPill();

    receive(matchProposed);

    expect(styleOf(accentOf("Adversaire trouvé !"))).toBeFalsy();
  });
});

const arc = () => pill().querySelector<HTMLElement>("[data-ring-arc]");

describe("the search's ring", () => {
  test("turns", async () => {
    await renderPill();

    gsapClock.advance(0.3);

    expect(arc()?.style.transform).toContain("rotate");
  });

  test("stays still under reduced motion", async () => {
    reduceMotion();
    await renderPill();

    gsapClock.advance(0.3);

    expect(styleOf(arc())).toBeFalsy();
  });
});

test("nothing of the search's animations is left once the app is gone", async () => {
  const { user } = await renderQueue();

  await user.click(screen.getByRole("button", { name: "S'entraîner" }));
  gsapClock.advance(CONTENT_OUT_SECONDS / 2);
  cleanup();

  expect(ghosts()).toHaveLength(0);
  expect(gsap.globalTimeline.getChildren(true, true, true)).toHaveLength(0);
});
