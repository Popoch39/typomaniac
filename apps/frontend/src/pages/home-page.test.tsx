import { act, screen, waitFor, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import type { Rank } from "ranked";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Me } from "@/api/me";
import { PLAY_FADE_SECONDS } from "@/components/play/use-play-fade";
import { useAuthStore } from "@/stores/auth-store";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { useSettingsStore } from "@/stores/settings-store";
import { fakeServer, idle, queueElsewhere } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, friend, renderAppFor } from "@/test/render-app";

// Jouer's three cards (board « A · Affiche »), the Run on /run, and the fade between the two.

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the stores outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

const sent = () => server().sentOfPlace();

// Jouer watched and left too.
const allSent = () => server().sent;

const card = (name: string) => screen.getByRole("region", { name });

const rankedCard = () => card("Ranked");

const adaRanked = (rank: Rank | null): Me => ({ ...ada, rank });

// The page Jouer and the Run are shown in: the one the fade moves.
const page = () => screen.getByRole("main").querySelector("section");

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  gsapClock = holdGsapClock();
  useSettingsStore.setState(useSettingsStore.getInitialState());
  useAuthStore.setState(useAuthStore.getInitialState());
});

afterEach(() => {
  gsapClock.release();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useConnectionStore.getState().close();
  useDuelStore.setState(useDuelStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("Jouer's cards", () => {
  test.each([
    ["a Visitor", null],
    ["a User", ada],
  ])("are the same three for %s", async (_, reader) => {
    await renderAppFor("/fr", { reader, openSocket: sockets.open });

    expect(screen.getByRole("heading", { level: 1, name: "Choisis ton mode" })).toBeVisible();

    for (const name of ["Entraînement", "Ranked", "Duel entre amis"]) {
      expect(card(name)).toBeInTheDocument();
    }

    expect(screen.queryByLabelText("Zone de frappe")).not.toBeInTheDocument();
  });

  test("are named in English", async () => {
    await renderAppFor("/en", { reader: ada, openSocket: sockets.open });

    expect(screen.getByRole("heading", { level: 1, name: "Pick your mode" })).toBeVisible();

    for (const name of ["Training", "Ranked", "Duel a Friend"]) {
      expect(card(name)).toBeInTheDocument();
    }

    expect(within(card("Training")).getByRole("button", { name: "words 50" })).toBeInTheDocument();
    expect(within(rankedCard()).getByRole("button", { name: "Start searching" })).toBeEnabled();
  });
});

describe("the Training card", () => {
  test.each([
    ["time 30", "30 s"],
    ["words 50", "50 mots"],
    ["time 60", "60 s"],
  ])("%s reads short, « %s », its name said again in a tooltip", async (preset, short) => {
    const { user } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });
    const link = within(card("Entraînement")).getByRole("button", { name: preset });

    expect(link).toHaveTextContent(short);

    await user.hover(link);

    expect(await screen.findByRole("tooltip")).toHaveTextContent(preset);
  });

  test("reads short in English too", async () => {
    await renderAppFor("/en", { reader: null, openSocket: sockets.open });

    expect(within(card("Training")).getByRole("button", { name: "words 50" })).toHaveTextContent(
      "50 words",
    );
  });

  test.each([
    ["time 30", "time", "30"],
    ["words 50", "words", "50"],
    ["time 60", "time", "60"],
  ])("%s opens the Run on its settings", async (preset, mode, count) => {
    const { user, url } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    await user.click(within(card("Entraînement")).getByRole("button", { name: preset }));

    expect(url()).toBe("/fr/run");
    expect(await screen.findByLabelText("Zone de frappe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: mode })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: count })).toHaveAttribute("aria-pressed", "true");
  });

  test("keeps the preset for the Runs after it, as a setting chosen", async () => {
    const { user } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    await user.click(within(card("Entraînement")).getByRole("button", { name: "words 50" }));

    expect(JSON.parse(localStorage.getItem("typomaniac-settings") ?? "{}")).toMatchObject({
      state: { mode: "words", words: 50 },
    });

    await user.click(await screen.findByRole("button", { name: "Suivant" }));

    expect(screen.getByText("0/50")).toBeInTheDocument();
  });

  test("a preset already set draws a fresh Run, ready to type", async () => {
    const { user } = await renderAppFor("/fr/run", { reader: null, openSocket: sockets.open });

    await user.keyboard("a");

    expect(screen.queryByRole("group", { name: "Réglages" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^Jouer/ }));
    await user.click(within(card("Entraînement")).getByRole("button", { name: "time 30" }));

    expect(await screen.findByRole("group", { name: "Réglages" })).toBeInTheDocument();
  });
});

describe("/run", () => {
  test("opened directly, shows a Run ready to type, without Solo or Duel to choose", async () => {
    await renderAppFor("/fr/run", { reader: ada, openSocket: sockets.open });

    expect(screen.getByLabelText("Zone de frappe")).toHaveFocus();
    expect(screen.getByRole("group", { name: "Mode" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Jeu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "duel" })).not.toBeInTheDocument();
  });

  test("Précédent leads back to the cards", async () => {
    const { user, history } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    await user.click(within(card("Entraînement")).getByRole("button", { name: "time 30" }));
    act(() => history.back());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Choisis ton mode" }),
    ).toBeInTheDocument();
  });
});

describe("the Ranked card", () => {
  test("Lancer la recherche joins the Queue and shows the search on Jouer; Annuler, the cards again", async () => {
    const { user, url } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    await user.click(within(rankedCard()).getByRole("button", { name: "Lancer la recherche" }));

    expect(sent()).toEqual([{ type: "join-queue" }]);
    expect(url()).toBe("/fr");
    expect(
      screen.getByRole("heading", { name: "On te trouve un adversaire…" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Entraînement" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "leave-queue" }]);
    expect(card("Ranked")).toBeInTheDocument();
  });

  test("shows how many wait in the Queue and the Estimated wait, told live while Jouer is shown", async () => {
    const { user } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());

    expect(allSent()).toEqual([{ type: "watch-queue" }]);
    expect(within(rankedCard()).queryByText(/en file$/)).not.toBeInTheDocument();

    receive({ type: "queue-overview", size: 3, estimatedWait: 12_400 });

    expect(within(rankedCard()).getByText("3 joueurs en file")).toBeInTheDocument();
    expect(within(rankedCard()).getByText("≈ 13 s d'attente")).toBeInTheDocument();

    // Without a recent pairing, only the size.
    receive({ type: "queue-overview", size: 0, estimatedWait: null });

    expect(within(rankedCard()).getByText("0 joueur en file")).toBeInTheDocument();
    expect(within(rankedCard()).queryByText(/d'attente$/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^Classement/ }));

    expect(allSent()).toEqual([{ type: "watch-queue" }, { type: "unwatch-queue" }]);
  });

  test("the search launched here or in another tab hides the overview", async () => {
    const { user } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    receive({ type: "queue-overview", size: 3, estimatedWait: null });
    receive(queueElsewhere());

    expect(within(rankedCard()).queryByText("3 joueurs en file")).not.toBeInTheDocument();

    receive(idle());
    receive({ type: "queue-overview", size: 2, estimatedWait: null });

    expect(within(rankedCard()).getByText("2 joueurs en file")).toBeInTheDocument();

    await user.click(within(rankedCard()).getByRole("button", { name: "Lancer la recherche" }));

    // The cards leave Jouer for the search.
    expect(allSent()).toHaveLength(3);
    expect(allSent()).toEqual(
      expect.arrayContaining([
        { type: "watch-queue" },
        { type: "unwatch-queue" },
        { type: "join-queue" },
      ]),
    );
  });

  test("a Duel played in another tab keeps the overview, as the server goes on telling it", async () => {
    await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    receive({ type: "queue-overview", size: 3, estimatedWait: null });
    receive({ type: "elsewhere", place: "duel" });

    expect(within(rankedCard()).getByText("3 joueurs en file")).toBeInTheDocument();
  });

  test("a Visitor is asked to sign in", async () => {
    const { user } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    // No socket: none of the Queue's figures.
    expect(within(rankedCard()).queryByText(/en file$/)).not.toBeInTheDocument();

    await user.click(within(rankedCard()).getByRole("button", { name: "Lancer la recherche" }));

    expect(await screen.findByRole("dialog", { name: "Se connecter" })).toBeInTheDocument();
  });

  test("a User without a Handle is asked to choose one", async () => {
    const { user } = await renderAppFor("/fr", {
      reader: { ...ada, handle: null },
      openSocket: sockets.open,
    });

    await user.click(await screen.findByRole("button", { name: "Plus tard" }));

    expect(within(rankedCard()).queryByRole("button", { name: "Lancer la recherche" })).toBeNull();

    await user.click(within(rankedCard()).getByRole("button", { name: "Choisir mon Handle" }));

    expect(await screen.findByRole("dialog", { name: "Choisis ton Handle" })).toBeInTheDocument();
  });

  test("shows the User's rank, its Crest and its TP bar", async () => {
    await renderAppFor("/fr", {
      reader: adaRanked({ tier: "gold", division: 2, tp: 42, shielded: false }),
      openSocket: sockets.open,
    });

    expect(within(rankedCard()).getByText("Gold II · 42 TP")).toBeInTheDocument();
    expect(within(rankedCard()).getByText("Gold II")).toHaveClass("sr-only");
    expect(within(rankedCard()).getByRole("meter", { name: "TP de la Division" })).toHaveAttribute(
      "aria-valuetext",
      "42 TP sur 100 · 58 TP avant Gold I",
    );
  });

  test("in Placement, where the User is of it", async () => {
    await renderAppFor("/fr", {
      reader: adaRanked({ placementsLeft: 3 }),
      openSocket: sockets.open,
    });

    expect(within(rankedCard()).getByText("Placement · 3 Duels restants")).toBeInTheDocument();
    expect(within(rankedCard()).getByRole("meter", { name: "Placement" })).toHaveAttribute(
      "aria-valuetext",
      "2 Duels de Placement joués sur 5",
    );
  });

  test("before any Duel, Unranked", async () => {
    await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    expect(within(rankedCard()).getByText("Non classé")).toBeInTheDocument();
  });

  test("a Visitor has no rank there", async () => {
    await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    expect(within(rankedCard()).queryByText("Non classé")).not.toBeInTheDocument();
    expect(within(rankedCard()).queryByRole("meter")).not.toBeInTheDocument();
  });

  test("under a Queue lock, the time left, then open again once it is over", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(100_000);
    await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle(80_000, 20_000));

    const search = within(rankedCard()).getByRole("button", { name: /^Lancer la recherche/ });

    expect(search).toBeDisabled();
    expect(search).toHaveTextContent("1:00");

    vi.setSystemTime(160_000);

    await waitFor(() => expect(search).toBeEnabled());
    expect(sent()).toEqual([]);
  });

  test("a Dodge here shows its Queue lock on the card, back from the search", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(100_000);

    const { user } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    await user.click(within(rankedCard()).getByRole("button", { name: "Lancer la recherche" }));
    receive({ type: "queued" });
    receive({
      type: "match-proposed",
      expiresAt: 30_000,
      serverTime: 20_000,
      opponent: { handle: "kzr_", image: null, ornament: null },
      selfOrnament: null,
      selfRank: null,
      opponentRank: null,
      selfAccepted: false,
      opponentAccepted: false,
      dodgeLock: 120_000,
    });
    await user.click(await screen.findByRole("button", { name: /^Refuser/ }));
    receive({ type: "proposal-ended", reason: "declined", queueLockedUntil: 140_000 });
    await user.click(await screen.findByRole("button", { name: "Retour au Solo" }));

    const search = within(rankedCard()).getByRole("button", { name: /^Lancer la recherche/ });

    expect(search).toBeDisabled();
    expect(search).toHaveTextContent("2:00");
  });

  test("the search launched in another tab is said, with no way to launch a second one", async () => {
    await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(queueElsewhere());

    expect(within(rankedCard()).getByText("Recherche dans un autre onglet")).toBeInTheDocument();
    expect(within(rankedCard()).queryByRole("button")).not.toBeInTheDocument();

    receive(idle());

    expect(within(rankedCard()).getByRole("button", { name: "Lancer la recherche" })).toBeEnabled();
  });
});

describe("the card of the Duel with a Friend", () => {
  test("Défier un Friend leads to Friends", async () => {
    const { user, url } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    await user.click(
      within(card("Duel entre amis")).getByRole("button", { name: "Défier un Friend" }),
    );

    expect(url()).toBe("/fr/friends");
  });

  test("shows the User facing a Friend online, none while no Friend is", async () => {
    await renderAppFor("/fr", {
      reader: ada,
      openSocket: sockets.open,
      friends: [friend("grace"), friend("linus")],
    });

    expect(within(card("Duel entre amis")).queryByText(/^Toi face à/)).not.toBeInTheDocument();

    receive({
      type: "friends-snapshot",
      presences: [
        { userId: "grace-id", presence: "in-duel" },
        { userId: "linus-id", presence: "online" },
      ],
      requestsReceived: 0,
    });

    expect(
      within(card("Duel entre amis")).getByText("Toi face à @linus, en ligne"),
    ).toBeInTheDocument();
  });

  test("a Visitor, who has no Friends, is asked to sign in", async () => {
    const { user, url } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    await user.click(
      within(card("Duel entre amis")).getByRole("button", { name: "Défier un Friend" }),
    );

    expect(await screen.findByRole("dialog", { name: "Se connecter" })).toBeInTheDocument();
    expect(url()).toBe("/fr");
  });
});

describe("the fade between Jouer and the Run", () => {
  test("the Run fades in from the cards, rising a little, and is left without a style", async () => {
    const { user } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    await user.click(within(card("Entraînement")).getByRole("button", { name: "time 30" }));
    await screen.findByLabelText("Zone de frappe");

    expect(page()?.style.opacity).toBe("0");
    expect(page()?.style.transform).toContain("10px");

    gsapClock.advance(PLAY_FADE_SECONDS / 2);

    expect(Number(page()?.style.opacity)).toBeGreaterThan(0);
    expect(Number(page()?.style.opacity)).toBeLessThan(1);

    gsapClock.advance(PLAY_FADE_SECONDS);

    expect(page()?.getAttribute("style")).toBeFalsy();
  });

  test("the cards fade in back from the Run", async () => {
    const { user } = await renderAppFor("/fr/run", { reader: null, openSocket: sockets.open });

    await user.click(screen.getByRole("link", { name: /^Jouer/ }));
    await screen.findByRole("heading", { level: 1, name: "Choisis ton mode" });

    expect(page()?.style.opacity).toBe("0");
  });

  test("no other way in fades: a first load, another page", async () => {
    const { user } = await renderAppFor("/fr/leaderboard", {
      reader: null,
      openSocket: sockets.open,
    });

    await user.click(screen.getByRole("link", { name: /^Jouer/ }));
    await screen.findByRole("heading", { level: 1, name: "Choisis ton mode" });

    expect(page()?.getAttribute("style")).toBeFalsy();
  });

  test("under reduced motion, the Run is there at once", async () => {
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

    const { user } = await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    await user.click(within(card("Entraînement")).getByRole("button", { name: "time 30" }));
    await screen.findByLabelText("Zone de frappe");

    expect(page()?.getAttribute("style")).toBeFalsy();
  });
});
