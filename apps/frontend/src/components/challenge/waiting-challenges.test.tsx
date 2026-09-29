import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { ChallengeNotices } from "@/components/challenge/challenge-notices";
import { WaitingChallenges } from "@/components/challenge/waiting-challenges";
import { Toaster } from "@/components/ui/sonner";
import { useConnectionStore } from "@/stores/connection-store";
import { useLocaleStore } from "@/stores/locale-store";
import { fakeServer } from "@/test/fake-socket";

const alan = { id: "alan-id", handle: "alan", image: null };

const grace = { id: "grace-id", handle: "grace", image: null };

// The User's Challenges over the page and their toasts, the server telling that Ada's Challenge to
// Alan and Grace's to Ada both have 30 s left.
const renderChallenges = () => {
  const sockets = fakeServer();

  useConnectionStore.getState().open(sockets.open);
  render(
    <>
      <WaitingChallenges />
      <ChallengeNotices />
      <Toaster />
    </>,
  );

  const serverTime = Date.now();

  act(() => {
    sockets.server().receive({
      type: "challenges-snapshot",
      sent: { id: "to-alan", to: alan, expiresAt: serverTime + 30_000 },
      received: [{ id: "from-grace", from: grace, expiresAt: serverTime + 30_000 }],
      serverTime,
    });
  });

  return sockets;
};

// A test that opens the connection leaves none behind, even when it fails.
afterEach(() => {
  useConnectionStore.getState().close();
});

describe("WaitingChallenges", () => {
  test("the Challenge sent, to cancel, and the one received, to answer", () => {
    renderChallenges();

    const cards = within(screen.getByRole("list", { name: "Challenges" })).getAllByRole("listitem");

    expect(cards.map((card) => card.textContent)).toEqual([
      "AChallenge envoyé à @alan30 sAnnuler",
      "G@grace te défie en Duel30 sRefuserAccepter",
    ]);
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("the Challenge sent, to cancel, and the one received, to answer", () => {
      renderChallenges();

      const cards = within(screen.getByRole("list", { name: "Challenges" })).getAllByRole(
        "listitem",
      );

      expect(cards.map((card) => card.textContent)).toEqual([
        "AChallenge sent to @alan30 sCancel",
        "G@grace challenges you to a Duel30 sDeclineAccept",
      ]);
    });

    test("a Challenge the server refused to send is toasted", async () => {
      const sockets = renderChallenges();

      act(() => {
        sockets
          .server()
          .receive({ type: "challenge-refused", userId: "mary-id", reason: "offline" });
      });

      expect(await screen.findByText("This Friend is offline.")).toBeInTheDocument();
    });

    test("the User's Challenge declined is toasted", async () => {
      const sockets = renderChallenges();

      act(() => {
        sockets
          .server()
          .receive({ type: "challenge-ended", challengeId: "to-alan", reason: "declined" });
      });

      expect(await screen.findByText("@alan declined your Challenge.")).toBeInTheDocument();
    });
  });
});
