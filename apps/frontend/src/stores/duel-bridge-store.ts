import { create } from "zustand";

import { type BridgeCard, layBridgeCard } from "@/components/duel-bridge/bridge-card";
import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import type { Clock } from "@/components/run/clock-context";
import {
  type DuelOpponent,
  type DuelPlay,
  type DuelState,
  duelOf,
  useDuelStore,
} from "@/stores/duel-store";

// The Duel on its way, from its pairing to the end of the Face-off: what the Face-off shows, the
// copy of the card it comes from (null without one), and whether the Face-off's panels cover the
// screen yet.
export type BridgedDuel = {
  id: string;
  opponent: DuelOpponent;
  pairing: FaceOffPairing;
  startsAt: number;
  card: BridgeCard | null;
  covered: boolean;
};

type DuelBridgeStore = { bridged: BridgedDuel | null };

// The Duel's bridge: it holds the screen from « C'est parti ! » to the Face-off's exit, whatever
// page the User is on, so that neither the Duel's scene nor its URL ever shows before the
// Face-off covers them.
export const useDuelBridgeStore = create<DuelBridgeStore>()(() => ({ bridged: null }));

const pairingOf = (duel: DuelPlay): FaceOffPairing => ({
  selfOrnament: duel.selfOrnament,
  selfRank: duel.selfRank,
  opponentRank: duel.opponentRank,
  selfForm: duel.selfForm,
  opponentForm: duel.opponentForm,
  selfStake: duel.selfStake,
});

// The bridge lets go: the copy of the card goes with it, wherever its fade stands.
export const releaseBridge = () => {
  useDuelBridgeStore.getState().bridged?.card?.node.remove();
  useDuelBridgeStore.setState({ bridged: null });
};

// The Face-off's panels cover the screen: the Duel's scene and URL may show under them.
export const coverScene = () =>
  useDuelBridgeStore.setState(({ bridged }) =>
    bridged === null || bridged.covered ? { bridged } : { bridged: { ...bridged, covered: true } },
  );

// The Duel is over, or no longer played here: nothing left to bridge.
const isGone = (state: DuelState) =>
  state.phase === "ended" || state.phase === "disconnected" || state.phase === "elsewhere";

const follow = (state: DuelState, clock: Clock) => {
  const { bridged } = useDuelBridgeStore.getState();
  const duel = duelOf(state);

  // The same Duel, resumed: its start as the server sets it again.
  if (duel !== null && bridged?.id === duel.id) {
    if (duel.startsAt !== bridged.startsAt) {
      useDuelBridgeStore.setState({ bridged: { ...bridged, startsAt: duel.startsAt } });
    }

    return;
  }

  // A Duel found before its start: the bridge takes the card it comes from, before it goes.
  if (duel !== null && state.phase === "countdown" && clock() < duel.startsAt) {
    releaseBridge();
    useDuelBridgeStore.setState({
      bridged: {
        id: duel.id,
        opponent: duel.opponent,
        pairing: pairingOf(duel),
        startsAt: duel.startsAt,
        card: layBridgeCard(),
        covered: false,
      },
    });

    return;
  }

  // Another Duel, joined after its start (a resume), or none anymore. Waiting for the place again
  // (a Challenge taken to the Duel's URL) keeps it.
  if (bridged !== null && (duel !== null || isGone(state))) {
    releaseBridge();
  }
};

// Follows the Duel store, on the tab's clock, until the function returned stops it and lets go.
// A store's listener runs as the message arrives, before React takes the card off the page.
export const bridgeDuels = (clock: Clock) => {
  const unsubscribe = useDuelStore.subscribe(({ state }) => follow(state, clock));

  return () => {
    unsubscribe();
    releaseBridge();
  };
};

// The Duel's scene and URL wait under the bridge until the Face-off covers the screen.
export const sceneHeldOf = ({ bridged }: DuelBridgeStore) => bridged !== null && !bridged.covered;
