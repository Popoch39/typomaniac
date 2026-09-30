import { act, screen, waitFor, within } from "@testing-library/react";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { useSettingsStore } from "@/stores/settings-store";
import { fakeServer, idle } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada, renderAppFor } from "@/test/render-app";

// The Match proposal has no dialog: the search carries it, in the form it has at the time, the
// card on Jouer or the Queue pill on any other page.

const opponent = { handle: "kzr_", image: null, ornament: null };

// Ada, Gold II, against kzr_ in Placement: 10 s to answer, 2 min of Queue lock to decline.
const matchProposed: ServerMessage = {
  type: "match-proposed",
  expiresAt: 30_000,
  serverTime: 20_000,
  opponent,
  selfOrnament: null,
  selfRank: { tier: "gold", division: 2, tp: 64, shielded: false },
  opponentRank: { placementsLeft: 3 },
  selfAccepted: false,
  opponentAccepted: false,
  dodgeLock: 120_000,
};

const duelFound: ServerMessage = {
  type: "duel-found",
  duel: {
    id: "duel-1",
    seed: 42,
    language: "en",
    wordListVersion: 1,
    seconds: 30,
    startsAt: 4_500,
  },
  opponent,
  selfOrnament: null,
  serverTime: 0,
  pace: 50,
  opponentPace: 50,
  selfRank: { tier: "gold", division: 2, tp: 64, shielded: false },
  opponentRank: { placementsLeft: 3 },
  selfForm: null,
  opponentForm: null,
  selfStake: null,
};

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the stores outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

const sent = () => server().sentOfPlace();

const sidebar = () => screen.getByRole("complementary", { name: "Barre latérale" });

const sidebarLink = (name: string) => within(sidebar()).getByRole("link", { name });

const card = (name: string | RegExp = "Adversaire trouvé !") =>
  screen.getByRole("region", { name });

const pill = (name: string | RegExp = "Adversaire trouvé !") =>
  screen.getByRole("region", { name });

// Ada on Jouer, then in the Queue: she has waited 7 s, on a clock stopped at 100 s.
const renderQueue = async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(100_000);

  const app = await renderAppFor("/fr", { reader: ada, openSocket: sockets.open });

  receive(idle());
  await app.user.click(screen.getByRole("button", { name: "Lancer la recherche" }));
  receive({ type: "queued" });
  receive({
    type: "queue-status",
    joinedAt: 10_000,
    serverTime: 17_000,
    size: 3,
    estimatedWait: 12_000,
  });

  return app;
};

// The same, having left Jouer for the Run: the search folded into the Queue pill, a Run typed.
const renderRun = async () => {
  const app = await renderQueue();

  await app.user.click(screen.getByRole("button", { name: "S'entraîner" }));
  await screen.findByLabelText("Zone de frappe");
  await app.user.keyboard("a");

  return app;
};

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  gsapClock = holdGsapClock();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

afterEach(() => {
  gsapClock.release();
  vi.useRealTimers();
  useConnectionStore.getState().close();
  useDuelStore.setState(useDuelStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("a Match proposal in the search unfolded", () => {
  test("the card carries it, with both Users, their ranks and the time left, and no dialog", async () => {
    await renderQueue();
    receive(matchProposed);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(card()).getByText("ada")).toBeInTheDocument();
    expect(within(card()).getByText("Gold II")).toBeInTheDocument();
    expect(within(card()).getByText("kzr_")).toBeInTheDocument();
    expect(within(card()).getByText("Placement · 3 Duels restants")).toBeInTheDocument();
    expect(within(card()).getByText("10")).toBeInTheDocument();
    expect(within(card()).getByText("Refuser bloquera la Queue 2 min")).toBeInTheDocument();
  });

  test("Accepter le Duel accepts it", async () => {
    const { user } = await renderQueue();

    receive(matchProposed);
    await user.click(within(card()).getByRole("button", { name: /^Accepter le Duel/ }));

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "accept-proposal" }]);
  });

  test("Refuser declines it", async () => {
    const { user } = await renderQueue();

    receive(matchProposed);
    await user.click(within(card()).getByRole("button", { name: "Refuser" }));

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "decline-proposal" }]);
  });

  test("Entrée accepts it, Échap does nothing", async () => {
    const { user } = await renderQueue();

    receive(matchProposed);
    await user.keyboard("{Escape}");

    expect(sent()).toEqual([{ type: "join-queue" }]);

    await user.keyboard("{Enter}");

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "accept-proposal" }]);
  });

  test("a Dodge shows its Queue lock in the card, and Retour au Solo the cards of Jouer", async () => {
    const { user } = await renderQueue();

    receive(matchProposed);
    await user.click(within(card()).getByRole("button", { name: "Refuser" }));
    receive({ type: "proposal-ended", reason: "declined", queueLockedUntil: 140_000 });

    expect(
      within(card("Duel refusé")).getByText(
        "Tu as quitté la file. Aucun TP en jeu. Queue bloquée 2 min.",
      ),
    ).toBeInTheDocument();
    expect(
      within(card("Duel refusé")).getByRole("button", { name: /^Relancer la recherche/ }),
    ).toBeDisabled();

    await user.click(within(card("Duel refusé")).getByRole("button", { name: "Retour au Solo" }));

    expect(screen.getByRole("region", { name: "Ranked" })).toBeInTheDocument();
  });

  test("the opponent declining picks the search back up, with the wait it had", async () => {
    await renderQueue();

    receive(matchProposed);
    receive({ type: "proposal-ended", reason: "opponent-declined" });

    expect(card("kzr_ a refusé")).toBeInTheDocument();

    receive({ type: "queued" });

    expect(
      await screen.findByRole("heading", { name: "On te trouve un adversaire…" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Temps d'attente")).toHaveTextContent("0:07");
  });
});

describe("a Match proposal in the Queue pill", () => {
  test("the pill turns to it, with the opponent, their rank and the time left", async () => {
    const { user, url } = await renderQueue();

    await user.click(sidebarLink("Ranked"));
    receive(matchProposed);

    expect(url()).toBe("/fr/ranked");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(pill()).getByText("kzr_")).toBeInTheDocument();
    expect(within(pill()).getByText(/Placement · 3 Duels restants/)).toBeInTheDocument();
    expect(within(pill()).getByRole("timer", { name: "Temps pour répondre" })).toHaveTextContent(
      "10 s",
    );
  });

  test("Accepter accepts it, and the Duel found leads to /duel", async () => {
    const { user, url } = await renderQueue();

    await user.click(sidebarLink("Friends"));
    receive(matchProposed);
    await user.click(within(pill()).getByRole("button", { name: /^Accepter/ }));

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "accept-proposal" }]);
    expect(pill("Accepté")).toHaveTextContent("En attente de kzr_…");

    receive({ type: "proposal-ended", reason: "accepted" });
    receive(duelFound);

    await waitFor(() => expect(url()).toBe("/fr/duel"));
    expect(sent()).not.toContainEqual({ type: "leave-queue" });
  });

  test("Refuser declines it; its Dodge shows the Queue lock, Retour au Solo stays on the page", async () => {
    const { user, url } = await renderQueue();

    await user.click(sidebarLink("Ranked"));
    receive(matchProposed);
    await user.click(within(pill()).getByRole("button", { name: "Refuser" }));
    receive({ type: "proposal-ended", reason: "declined", queueLockedUntil: 140_000 });

    expect(
      within(pill("Duel refusé")).getByText(
        "Tu as quitté la file. Aucun TP en jeu. Queue bloquée 2 min.",
      ),
    ).toBeInTheDocument();
    expect(
      within(pill("Duel refusé")).getByRole("button", { name: /^Relancer la recherche/ }),
    ).toBeDisabled();

    await user.click(within(pill("Duel refusé")).getByRole("button", { name: "Retour au Solo" }));

    expect(screen.queryByRole("region", { name: "Duel refusé" })).not.toBeInTheDocument();
    expect(url()).toBe("/fr/ranked");
    expect(sent()).toEqual([{ type: "join-queue" }, { type: "decline-proposal" }]);
  });

  test("left without an answer, it says so with its Queue lock", async () => {
    const { user } = await renderQueue();

    await user.click(sidebarLink("Ranked"));
    receive(matchProposed);
    receive({ type: "proposal-ended", reason: "missed", queueLockedUntil: 140_000 });

    expect(
      within(pill("Temps écoulé")).getByText(
        "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu. Queue bloquée 2 min.",
      ),
    ).toBeInTheDocument();
    expect(sent()).toEqual([{ type: "join-queue" }]);
  });

  test("the opponent declining folds it back into the search, with the wait it had", async () => {
    const { user } = await renderQueue();

    await user.click(sidebarLink("Ranked"));
    receive(matchProposed);
    receive({ type: "proposal-ended", reason: "opponent-declined" });

    expect(pill("kzr_ a refusé")).toBeInTheDocument();

    receive({ type: "queued" });

    expect(
      within(pill("Recherche en cours")).getByRole("timer", { name: "Temps d'attente" }),
    ).toHaveTextContent("0:07");
  });
});

describe("a Match proposal during a Run", () => {
  test("never covers the Text: the pill carries it, out of the page", async () => {
    await renderRun();
    receive(matchProposed);

    expect(screen.getByLabelText("Zone de frappe")).toBeInTheDocument();
    expect(pill().closest("main")).toBeNull();
  });

  test("Entrée accepts it while typing, Échap does nothing", async () => {
    const { user } = await renderRun();

    receive(matchProposed);
    await user.keyboard("{Escape}");

    expect(sent()).toEqual([{ type: "join-queue" }]);

    await user.keyboard("{Enter}");

    expect(sent()).toEqual([{ type: "join-queue" }, { type: "accept-proposal" }]);
  });

  test("accepting it drops the Run, without a Result, then leads to /duel", async () => {
    const { user, url } = await renderRun();

    receive(matchProposed);
    await user.click(within(pill()).getByRole("button", { name: /^Accepter/ }));

    // The Run is no longer being typed, a new one waits in its place: the sidebar and the
    // settings are back, and no Result is shown.
    expect(screen.getByLabelText("Barre latérale")).not.toHaveAttribute("data-faded");
    expect(screen.getByRole("group", { name: "Réglages" })).toBeInTheDocument();
    expect(screen.getByLabelText("Zone de frappe")).toBeInTheDocument();

    receive({ type: "proposal-ended", reason: "accepted" });
    receive(duelFound);

    await waitFor(() => expect(url()).toBe("/fr/duel"));
  });
});
