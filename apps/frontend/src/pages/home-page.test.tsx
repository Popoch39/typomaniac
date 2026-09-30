import { act, screen, waitFor, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import { gsap } from "gsap";
import type { Rank } from "ranked";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Activity } from "@/api/activity";
import type { Me } from "@/api/me";
import { GHOST_PAUSE_SECONDS } from "@/components/play/use-ghost-typing";
import { PLAY_FADE_SECONDS } from "@/components/play/use-play-fade";
import { useAuthStore } from "@/stores/auth-store";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlayStore } from "@/stores/play-store";
import { useRunStore } from "@/stores/run-store";
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

// The Users last to join the Queue, by their Handle, without an image.
const waitingAs = (...handles: string[]) => handles.map((handle) => ({ handle, image: null }));

// The line of the Queue's size, its number set apart from its words: null without one.
const queueSizeLine = () =>
  within(rankedCard()).queryByText(
    (_, element) => element?.tagName === "P" && /en file/u.test(element.textContent ?? ""),
  );

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

// The Ghost's Best Run on 30 s in English: Seed 42 gives « small help while late… » (pinned in the
// typing-engine tests), typed « smull help » one key every 100 ms, so « small » is a Wrong word.
const GHOST_TYPED = "smull help ";

const ghostKeystrokes = [...GHOST_TYPED].map((char, index) => ({
  kind: "char" as const,
  char,
  at: index * 100,
}));

const time30 = { mode: "time", length: 30, language: "en" } as const;

const ghostBestRun = {
  setting: time30,
  bestRun: { seed: 42, wordListVersion: 1, keystrokes: ghostKeystrokes, wpm: 92.4 },
};

// Its typing lasts up to its last Keystroke.
const GHOST_TYPING_SECONDS = 1;

const trainingCard = () => card("Entraînement");

// The glimpse of the Text on the card, hidden from screen readers.
const excerpt = () => {
  const found = trainingCard().querySelector("[data-excerpt]");

  if (!(found instanceof HTMLElement)) {
    throw new Error("No excerpt on the Training card");
  }

  return found;
};

const wordOf = (index: number) => excerpt().querySelector(`[data-word="${index}"]`);

// The status of each letter of a word of the excerpt, as shown.
const statusesOf = (index: number) =>
  [...(wordOf(index)?.querySelectorAll("[data-status]") ?? [])].map((letter) =>
    letter.getAttribute("data-status"),
  );

const preferReducedMotion = () =>
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

const renderWithGhost = (path = "/fr") => {
  useSettingsStore.setState({ language: "en" });

  return renderAppFor(path, { reader: ada, openSocket: sockets.open, bestRuns: [ghostBestRun] });
};

describe("the Ghost on the Training card", () => {
  test("replays the Best Run of the setting on its Text, its wpm and setting told under it", async () => {
    await renderWithGhost();

    expect(excerpt()).toHaveAttribute("aria-hidden", "true");
    // Words are set apart by their gap, not by a space.
    expect(excerpt()).toHaveTextContent(/^smallhelpwhilelate/);
    expect(
      within(trainingCard()).getByText("Ton fantôme : ta meilleure Run, 92 wpm · 30 s"),
    ).toBeVisible();
  });

  test("is told in English", async () => {
    await renderWithGhost("/en");

    expect(
      within(card("Training")).getByText("Your ghost: your best Run, 92 wpm · 30 s"),
    ).toBeVisible();
  });

  test("follows the setting: another one without a Best Run shows the glimpse, no caption", async () => {
    await renderWithGhost();

    act(() => useSettingsStore.getState().setSeconds(60));

    expect(within(trainingCard()).queryByText(/fantôme/)).not.toBeInTheDocument();

    act(() => useSettingsStore.getState().setSeconds(30));

    expect(
      within(trainingCard()).getByText("Ton fantôme : ta meilleure Run, 92 wpm · 30 s"),
    ).toBeVisible();
  });

  test("types at the pace of its Keystrokes, its Wrong words waved, then starts again after a pause", async () => {
    await renderWithGhost();

    gsapClock.advance(0.35);

    expect(statusesOf(0)).toEqual(["correct", "correct", "incorrect", "correct", "pending"]);
    expect(wordOf(0)).not.toHaveAttribute("data-wrong");

    gsapClock.advance(0.3);

    expect(wordOf(0)).toHaveAttribute("data-wrong");
    expect(wordOf(0)?.querySelector("[data-wave]")).not.toBeNull();

    // Its typing done, 1 s in, it holds its last state through the pause.
    gsapClock.advance(GHOST_TYPING_SECONDS - 0.65 + 0.05);

    expect(statusesOf(1)).toEqual(["correct", "correct", "correct", "correct"]);

    // Then back at its start: 0.05 s into its typing again, its first letter only.
    gsapClock.advance(GHOST_PAUSE_SECONDS);

    expect(statusesOf(0)).toEqual(["correct", "pending", "pending", "pending", "pending"]);
    expect(statusesOf(1)).toEqual(["pending", "pending", "pending", "pending"]);
    expect(wordOf(0)).not.toHaveAttribute("data-wrong");
  });

  test("under reduced motion, shows the end of its excerpt, still", async () => {
    preferReducedMotion();
    await renderWithGhost();

    expect(wordOf(0)).toHaveAttribute("data-wrong");
    expect(statusesOf(1)).toEqual(["correct", "correct", "correct", "correct"]);

    gsapClock.advance(GHOST_TYPING_SECONDS + GHOST_PAUSE_SECONDS);

    expect(statusesOf(1)).toEqual(["correct", "correct", "correct", "correct"]);
  });

  test("leaving Jouer kills its timeline: nothing goes on in the background", async () => {
    const { router } = await renderWithGhost();

    expect(gsap.globalTimeline.getChildren(true, true, false)).not.toEqual([]);

    await act(() => router.navigate({ to: "/leaderboard" }));

    expect(gsap.globalTimeline.getChildren(true, true, false)).toEqual([]);
  });

  test.each([
    ["a Visitor", null],
    ["a User without a Best Run for the setting", ada],
  ])("for %s, the next Text's glimpse, a caret going on alone, no caption", async (_, reader) => {
    await renderAppFor("/fr", { reader, openSocket: sockets.open });

    const next = useRunStore.getState().run.words;

    expect(excerpt()).toHaveTextContent(new RegExp(`^${next[0]?.target}${next[1]?.target}`));
    expect(within(trainingCard()).queryByText(/fantôme/)).not.toBeInTheDocument();
    expect(excerpt()).toHaveAttribute("data-caret", "0:0");

    gsapClock.advance(2);

    // Only the caret goes on: nobody typed the Text, so no letter lights up.
    expect(excerpt()).not.toHaveAttribute("data-caret", "0:0");
    expect(excerpt().querySelector("[data-status]:not([data-status=pending])")).toBeNull();
  });

  test("under reduced motion, the glimpse's caret stays at its start", async () => {
    preferReducedMotion();
    await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    gsapClock.advance(2);

    expect(excerpt()).toHaveAttribute("data-caret", "0:0");
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
    expect(queueSizeLine()).not.toBeInTheDocument();

    receive({ type: "queue-overview", size: 3, estimatedWait: 12_400, waiting: [] });

    expect(queueSizeLine()).toHaveTextContent(/^3 joueurs en file · ≈ 13 s d'attente$/u);

    // Without a recent pairing, only the size.
    receive({ type: "queue-overview", size: 0, estimatedWait: null, waiting: [] });

    expect(queueSizeLine()).toHaveTextContent(/^0 joueur en file$/u);

    await user.click(screen.getByRole("link", { name: /^Classement/ }));

    expect(allSent()).toEqual([{ type: "watch-queue" }, { type: "unwatch-queue" }]);
  });

  test("the search launched here or in another tab hides the overview", async () => {
    const { user } = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    receive({ type: "queue-overview", size: 3, estimatedWait: null, waiting: [] });
    receive(queueElsewhere());

    expect(queueSizeLine()).not.toBeInTheDocument();

    receive(idle());
    receive({ type: "queue-overview", size: 2, estimatedWait: null, waiting: [] });

    expect(queueSizeLine()).toHaveTextContent(/^2 joueurs en file$/u);

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
    receive({ type: "queue-overview", size: 3, estimatedWait: null, waiting: [] });
    receive({ type: "elsewhere", place: "duel" });

    expect(queueSizeLine()).toHaveTextContent(/^3 joueurs en file$/u);
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

  test("shows the User's rank in words and its TP bar, no more Crest", async () => {
    await renderAppFor("/fr", {
      reader: adaRanked({ tier: "gold", division: 2, tp: 42, shielded: false }),
      openSocket: sockets.open,
    });

    // Said once, and seen: no Crest names it for screen readers alone.
    expect(within(rankedCard()).getByText("Gold II")).not.toHaveClass("sr-only");
    expect(within(rankedCard()).getByText("42/100 TP")).toBeVisible();
    expect(rankedCard().querySelector("svg")).toBeNull();
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

    expect(within(rankedCard()).getByText("Placement")).toBeVisible();
    expect(within(rankedCard()).getByText("2 / 5 Duels")).toBeVisible();
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

// A row of a card's list as read, the Locale's narrow spaces as plain ones.
const lineOf = (row: HTMLElement) => row.textContent?.replaceAll(/\s/gu, " ");

describe("the Ranked card, live", () => {
  test("shows the Queue right now: the last three to join, how many more, its size and Estimated wait", async () => {
    await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    receive({
      type: "queue-overview",
      size: 14,
      estimatedWait: 29_500,
      waiting: waitingAs("mia", "alan", "zoe"),
    });

    const queue = within(rankedCard()).getByRole("region", { name: "En file maintenant" });

    expect(queue).toHaveTextContent(
      /^MAZ\+11En file maintenant14 joueurs en file · ≈ 30 s d'attente$/u,
    );
  });

  test("a Queue of two shows their two avatars and no more", async () => {
    await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    receive(idle());
    receive({
      type: "queue-overview",
      size: 2,
      estimatedWait: null,
      waiting: waitingAs("mia", "zoe"),
    });

    const queue = within(rankedCard()).getByRole("region", { name: "En file maintenant" });

    expect(queue).toHaveTextContent(/^MZEn file maintenant2 joueurs en file$/u);
  });

  test("is told in English, the Tier's name the same", async () => {
    useLocaleStore.setState({ locale: "en" });
    await renderAppFor("/en", {
      reader: adaRanked({ tier: "gold", division: 2, tp: 42, shielded: false }),
      openSocket: sockets.open,
    });

    receive(idle());
    receive({ type: "queue-overview", size: 14, estimatedWait: 29_500, waiting: [] });

    expect(within(rankedCard()).getByRole("region", { name: "In queue now" })).toHaveTextContent(
      "In queue now14 players in the Queue",
    );
    expect(within(rankedCard()).getByText("Gold II")).toBeVisible();
    expect(rankedCard()).not.toHaveTextContent(/joueurs|En file|attente/);
  });

  test("a Visitor does not see the Queue", async () => {
    await renderAppFor("/fr", { reader: null, openSocket: sockets.open });

    expect(within(rankedCard()).queryByRole("region")).not.toBeInTheDocument();
    expect(within(rankedCard()).getByRole("button", { name: "Lancer la recherche" })).toBeVisible();
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

  test("with nothing of their Friends to show, the User facing a Friend online", async () => {
    await renderAppFor("/fr", {
      reader: ada,
      openSocket: sockets.open,
      friends: [friend("grace"), friend("linus")],
    });

    expect(within(card("Duel entre amis")).queryByText(/^Toi face à/)).not.toBeInTheDocument();

    receive({
      type: "friends-snapshot",
      presences: [{ userId: "linus-id", presence: "online" }],
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

const friendsCard = () => card("Duel entre amis");

const friendsList = (name = "Chez tes Friends") =>
  within(friendsCard()).getByRole("list", { name });

// A Friend as the Activity shows them, and what they did in a Duel.
const player = (
  handle: string,
  wpm: number,
  outcome: "win" | "loss" | "draw",
  tp: number | null,
) => ({
  ...friend(handle),
  wpm,
  outcome,
  tp,
});

// A Duel of `friendHandle` against `opponent`, `minutes` ago.
const duelActivity = (
  id: string,
  minutes: number,
  friendSide: ReturnType<typeof player>,
  opponent: ReturnType<typeof player>,
): Activity => ({
  type: "duel",
  id,
  at: Date.now() - minutes * 60_000,
  forfeit: false,
  friend: friendSide,
  opponent,
});

// Ada, beaten by Axel in a Challenge, and two Ranked Duels of Mia's.
const friendsActivity = (): Activity[] => [
  duelActivity("axel-ada", 1, player("axel", 97, "win", null), {
    ...player("ada", 94, "loss", null),
    id: ada.id,
  }),
  duelActivity("mia-noe", 5, player("mia", 104, "win", 18), player("noe", 97, "loss", -12)),
  duelActivity("mia-leo", 9, player("mia", 80, "loss", -14), player("leo", 90, "win", 15)),
  duelActivity("mia-old", 30, player("mia", 70, "win", 16), player("leo", 60, "loss", -16)),
];

// The server tells the Friends' Presences (the others offline), and that no Challenge waits.
const tellFriends = (presences: readonly (readonly [string, "online" | "in-duel"])[]) => {
  receive({
    type: "friends-snapshot",
    presences: presences.map(([handle, presence]) => ({ userId: `${handle}-id`, presence })),
    requestsReceived: 0,
  });
  receive({ type: "challenges-snapshot", sent: null, received: [], serverTime: 1_000 });
};

const renderWithFriends = (path = "/fr") =>
  renderAppFor(path, {
    reader: ada,
    openSocket: sockets.open,
    friends: ["axel", "mia", "zoe"].map(friend),
    activities: friendsActivity(),
  });

describe("« Chez tes Friends » on the card of the Duel with a Friend", () => {
  test("the Friends in a Duel first, then the last 3 Duels of the Friends, with their TP", async () => {
    await renderWithFriends();
    tellFriends([["zoe", "in-duel"]]);

    const rows = within(friendsList()).getAllByRole("listitem");

    expect(within(friendsCard()).getByRole("heading", { name: "Chez tes Friends" })).toBeVisible();
    expect(rows.map(lineOf)).toEqual([
      "Z@zoe est en Duel",
      "A@axel t'a battu97 – 94il y a 1 min",
      "M@mia a gagné un Duel+18 TPil y a 5 min",
      "M@mia a perdu un Duel−14 TPil y a 9 min",
    ]);
    // No way to watch a Duel.
    expect(within(friendsCard()).queryByRole("link", { name: /Regarder/ })).not.toBeInTheDocument();
  });

  test("a Challenge's Duel shows no TP", async () => {
    await renderWithFriends();

    const axel = within(friendsList()).getAllByRole("listitem")[0];

    expect(axel).toHaveTextContent("@axel t'a battu");
    expect(axel).not.toHaveTextContent("TP");
  });

  test("« Revanche ? » challenges back a Friend online who beat the User", async () => {
    const { user } = await renderWithFriends();

    tellFriends([
      ["axel", "online"],
      ["mia", "online"],
    ]);

    const rematches = within(friendsCard()).getAllByRole("button", { name: /^Revanche/ });

    // Only on Axel's win over Ada: Mia beat someone else.
    expect(rematches).toHaveLength(1);
    expect(rematches[0]).toHaveAccessibleName("Revanche contre @axel");
    expect(rematches[0]).toHaveTextContent("Revanche ?");

    await user.click(rematches[0]!);

    expect(sent()).toEqual([{ type: "send-challenge", userId: "axel-id" }]);
  });

  test.each([
    ["offline", []],
    ["in a Duel", [["axel", "in-duel"]]],
  ] as const)("no « Revanche ? » for a Friend %s", async (_, presences) => {
    await renderWithFriends();
    tellFriends([...presences]);

    expect(
      within(friendsCard()).queryByRole("button", { name: /^Revanche/ }),
    ).not.toBeInTheDocument();
  });

  test("« Revanche ? » follows the Challenge buttons' rule: one Challenge sent at a time", async () => {
    await renderWithFriends();
    tellFriends([["axel", "online"]]);
    receive({
      type: "challenge-sent",
      challenge: { id: "c-1", to: { id: "mia-id", handle: "mia", image: null }, expiresAt: 31_000 },
      serverTime: 1_000,
    });

    expect(within(friendsCard()).getByRole("button", { name: /^Défier @axel/ })).toBeDisabled();
  });

  test("an Activity told live comes first in the block", async () => {
    await renderWithFriends();

    receive({
      type: "activity-added",
      activity: duelActivity(
        "zoe-noe",
        0,
        player("zoe", 110, "win", 20),
        player("noe", 90, "loss", -20),
      ),
    });

    // Written into the cache, shown on React Query's next tick.
    await waitFor(() =>
      expect(lineOf(within(friendsList()).getAllByRole("listitem")[0]!)).toBe(
        "Z@zoe a gagné un Duel+20 TPà l'instant",
      ),
    );
  });

  test("without a Friend nor an Activity, the block is gone: the pitch and « Défier un Friend » stay", async () => {
    await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

    expect(within(friendsCard()).queryByRole("list")).not.toBeInTheDocument();
    expect(within(friendsCard()).getByText(/^Défie un Friend, sans enjeu de TP/)).toBeVisible();
    expect(within(friendsCard()).getByRole("button", { name: "Défier un Friend" })).toBeVisible();
  });

  test("a Visitor keeps today's card", async () => {
    await renderAppFor("/fr", {
      reader: null,
      openSocket: sockets.open,
      activities: friendsActivity(),
    });

    expect(within(friendsCard()).queryByRole("list")).not.toBeInTheDocument();
    expect(within(friendsCard()).getByRole("button", { name: "Défier un Friend" })).toBeVisible();
  });

  test("is told in English, no French left", async () => {
    useLocaleStore.setState({ locale: "en" });

    const { user } = await renderWithFriends("/en");

    tellFriends([
      ["axel", "online"],
      ["zoe", "in-duel"],
    ]);

    const block = card("Duel a Friend");

    const rows = within(within(block).getByRole("list", { name: "At your Friends'" })).getAllByRole(
      "listitem",
    );

    expect(rows.map(lineOf)).toEqual([
      "Z@zoe is in a Duel",
      "A@axel beat you97 – 941 min. agoRematch?",
      "M@mia won a Duel+18 TP5 min. ago",
      "M@mia lost a Duel−14 TP9 min. ago",
    ]);
    expect(block).not.toHaveTextContent(/Chez|Revanche|est en Duel|t'a battu|a gagné|il y a/);

    await user.click(within(block).getByRole("button", { name: "Rematch @axel" }));

    expect(sent()).toEqual([{ type: "send-challenge", userId: "axel-id" }]);
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
