import type { ClientMessage, ServerMessage } from "api";
import { create } from "zustand";

import { api } from "@/api/client";

type DuelFound = Extract<ServerMessage, { type: "duel-found" }>;

export type DuelState =
  | { phase: "connecting" }
  | { phase: "queued" }
  | { phase: "found"; duel: DuelFound["duel"]; opponent: DuelFound["opponent"] }
  // Another tab of the same User took the place.
  | { phase: "replaced" }
  | { phase: "disconnected" };

type DuelStore = {
  state: DuelState;
  // Opens the Duel socket and joins the Queue.
  connect: () => void;
  // Closes the socket: the server drops the User from the Queue.
  disconnect: () => void;
};

type DuelSocket = ReturnType<typeof api.duel.subscribe>;

// Outside the store's state: nothing renders from it.
let socket: DuelSocket | null = null;

const send = (target: DuelSocket, message: ClientMessage) => target.send(message);

const stateAfter = (state: DuelState, message: ServerMessage): DuelState => {
  switch (message.type) {
    case "queued":
      return { phase: "queued" };
    case "duel-found":
      return { phase: "found", duel: message.duel, opponent: message.opponent };
    case "replaced":
      return { phase: "replaced" };
    case "invalid-message":
      return state;
  }
};

// The Duel connection, one per tab. Only the current socket's events count: a closed one
// (Annuler, StrictMode's double mount) may still deliver its last events.
export const useDuelStore = create<DuelStore>()((set) => ({
  state: { phase: "connecting" },
  connect: () => {
    socket?.close();

    const current = api.duel.subscribe();

    socket = current;
    set({ state: { phase: "connecting" } });

    current.on("open", () => send(current, { type: "join-queue" }));
    current.subscribe(({ data }) => {
      if (socket === current) {
        set((store) => ({ state: stateAfter(store.state, data) }));
      }
    });
    current.on("close", () => {
      if (socket === current) {
        socket = null;
        set((store) =>
          store.state.phase === "replaced" ? store : { state: { phase: "disconnected" } },
        );
      }
    });
  },
  disconnect: () => {
    const current = socket;

    socket = null;
    current?.close();
  },
}));
