import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import type { FaceOffSound, FaceOffSounds } from "@/audio/face-off-sounds";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { MatchProposal } from "@/components/match-proposal/match-proposal";
import { TabAttentionContext } from "@/components/tab-attention/tab-attention-context";
import { ClockContext } from "@/components/run/clock-context";
import type { NotificationAccess, TabAttention } from "@/lib/tab-attention";
import type { ProposalStage, ProposalView } from "@/stores/duel-store";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

const me: Me = {
  id: "popoch-id",
  name: "Popoch",
  email: "popoch@example.com",
  image: null,
  handle: "popoch",
  rank: null,
  ornament: null,
};

const pending: ProposalView = {
  stage: "pending",
  expiresAt: 10_000,
  opponent: { handle: "kaelis", image: null, ornament: null },
  selfOrnament: null,
  selfRank: null,
  opponentRank: null,
  selfAccepted: false,
  opponentAccepted: false,
};

const at = (stage: ProposalStage): ProposalView => ({ ...pending, stage });

// A tab to watch: its title, whether it is hidden, the notification permission, and what was
// played and shown.
const fakeTab = ({
  hidden = false,
  permission = "granted",
}: {
  hidden?: boolean;
  permission?: NotificationAccess;
} = {}) => {
  const tab = {
    title: "typomaniac",
    played: new Array<FaceOffSound>(),
    notified: new Array<{ title: string; body: string }>(),
  };

  const attention: TabAttention = {
    readTitle: () => tab.title,
    writeTitle: (title) => {
      tab.title = title;
    },
    hidden: () => hidden,
    permission: () => permission,
    requestPermission: () => {},
    notify: (title, body) => {
      tab.notified.push({ title, body });
    },
  };

  const sounds: FaceOffSounds = {
    unlock: () => {},
    play: (sound) => {
      tab.played.push(sound);
    },
  };

  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);

  const within = (ui: ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <ClockContext value={() => 0}>
        <FaceOffSoundsContext value={sounds}>
          <TabAttentionContext value={attention}>{ui}</TabAttentionContext>
        </FaceOffSoundsContext>
      </ClockContext>
    </QueryClientProvider>
  );

  return { tab, within };
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  useFaceOffSoundStore.setState({ muted: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("a Match proposal, for a User looking elsewhere", () => {
  test("plays its sound once, on arrival", async () => {
    const { tab, within } = fakeTab();
    const { rerender } = render(within(<MatchProposal proposal={pending} />));

    rerender(within(<MatchProposal proposal={at("accepted")} />));
    rerender(within(<MatchProposal proposal={at("ready")} />));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(tab.played).toEqual(["proposal"]);
  });

  test("plays nothing while the Face-off is muted", async () => {
    useFaceOffSoundStore.setState({ muted: true });
    const { tab, within } = fakeTab();

    render(within(<MatchProposal proposal={pending} />));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(tab.played).toEqual([]);
  });

  test("plays nothing when it comes back already answered", async () => {
    const { tab, within } = fakeTab();

    render(within(<MatchProposal proposal={at("accepted")} />));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(tab.played).toEqual([]);
  });

  test("the tab's title blinks while it waits for an answer, then is back", async () => {
    const { tab, within } = fakeTab();
    const { rerender } = render(within(<MatchProposal proposal={pending} />));

    expect(tab.title).toBe("Adversaire trouvé !");

    await act(async () => vi.advanceTimersByTime(1000));
    expect(tab.title).toBe("typomaniac");

    await act(async () => vi.advanceTimersByTime(1000));
    expect(tab.title).toBe("Adversaire trouvé !");

    rerender(within(<MatchProposal proposal={at("accepted")} />));
    expect(tab.title).toBe("typomaniac");

    await act(async () => vi.advanceTimersByTime(3000));
    expect(tab.title).toBe("typomaniac");
  });

  test("the tab's title is back once the proposal is gone", () => {
    const { tab, within } = fakeTab();
    const { unmount } = render(within(<MatchProposal proposal={pending} />));

    unmount();

    expect(tab.title).toBe("typomaniac");
  });

  test("notifies a hidden tab, with the opponent, when allowed", async () => {
    const { tab, within } = fakeTab({ hidden: true });

    render(within(<MatchProposal proposal={pending} />));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(tab.notified).toEqual([
      { title: "Adversaire trouvé", body: "kaelis t'attend : 10 secondes pour accepter." },
    ]);
  });

  test.each([
    { hidden: false, permission: "granted" },
    { hidden: true, permission: "default" },
    { hidden: true, permission: "denied" },
    { hidden: true, permission: "unsupported" },
  ] as const)("never notifies otherwise: %o", async (tabState) => {
    const { tab, within } = fakeTab(tabState);

    render(within(<MatchProposal proposal={pending} />));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(tab.notified).toEqual([]);
  });

  test("tells screen readers the opponent and the time to answer, then the outcome", async () => {
    const { within } = fakeTab();
    const { rerender } = render(within(<MatchProposal proposal={pending} />));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Adversaire trouvé : kaelis, 10 secondes pour accepter",
    );

    rerender(within(<MatchProposal proposal={at("opponent-declined")} />));
    expect(screen.getByRole("status")).toHaveTextContent("kaelis a refusé, la recherche reprend.");
  });
});
