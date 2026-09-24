import type { ClientMessage, ServerMessage } from "api";
import { create } from "zustand";

import { api } from "@/api/client";

// The User's place as the server tells this connection: none, or in the Queue or a Duel, played
// here or not (another tab holds it, or none does while they come back to their Duel).
export type Place =
  | { at: "idle" }
  | { at: Extract<ServerMessage, { type: "elsewhere" }>["place"]; here: boolean };

export type ConnectionStatus =
  // No socket: a Visitor, or a User signed out.
  | "closed"
  // Opening, or opening again after a loss.
  | "connecting"
  // The server told the place.
  | "open";

type ConnectionStore = {
  status: ConnectionStatus;
  // Unknown until the server tells it on each new socket.
  place: Place | null;
  // Opens the socket, opened again whenever it is lost; `openSocket` opens it, and every
  // reconnection's.
  open: (openSocket?: OpenLiveSocket) => void;
  // Closes it for good: nothing is opened again.
  close: () => void;
};

// What the store uses of the socket: the server's messages, the connection's loss, sending and
// closing. Eden's socket in the app, a fake one in the tests.
export type LiveSocket = {
  subscribe: (listener: (event: { data: ServerMessage }) => void) => void;
  on: (event: "close", listener: () => void) => void;
  send: (message: ClientMessage) => void;
  close: () => void;
};

type OpenLiveSocket = () => LiveSocket;

const openApiSocket: OpenLiveSocket = () => api.duel.subscribe();

// The place after a message: the connection that plays it learns it from its own messages, the
// others from `idle` and `elsewhere`.
export const placeAfter = (place: Place | null, message: ServerMessage): Place | null => {
  switch (message.type) {
    case "idle":
    case "duel-ended":
      return { at: "idle" };
    case "elsewhere":
      return { at: message.place, here: false };
    case "queued":
      return { at: "queue", here: true };
    case "duel-found":
    case "duel-resumed":
      return { at: "duel", here: true };
    default:
      return place;
  }
};

const FIRST_RECONNECT_MS = 1_000;

const MAX_RECONNECT_MS = 8_000;

// Each failed attempt waits twice as long as the one before: a server that is down is not
// hammered, one that is back is reached within seconds.
export const reconnectDelay = (attempt: number) =>
  Math.min(FIRST_RECONNECT_MS * 2 ** attempt, MAX_RECONNECT_MS);

// Outside the store's state: nothing renders from them.
let socket: LiveSocket | null = null;

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Failed attempts since the server last answered.
let attempts = 0;

const listeners = new Set<(message: ServerMessage) => void>();

// Every message of the server, once the store has applied it: the Duel store listens to them.
export const onServerMessage = (listener: (message: ServerMessage) => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

// Dropped while no socket is open: whoever sends learns the state again from the server once back.
export const sendToServer = (message: ClientMessage) => socket?.send(message);

const stopReconnecting = () => {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  attempts = 0;
};

// The app's real-time connection (ADR 0007), one per tab, open on every page while a Session
// exists. Only the current socket's events count: a closed one (StrictMode's double mount, a
// sign-out) may still deliver its last events.
export const useConnectionStore = create<ConnectionStore>()((set, get) => {
  let openSocket = openApiSocket;

  const connect = () => {
    const current = openSocket();

    socket = current;
    reconnectTimer = null;

    current.subscribe(({ data }) => {
      if (socket !== current) {
        return;
      }

      attempts = 0;
      set({ status: "open", place: placeAfter(get().place, data) });

      for (const listener of listeners) {
        listener(data);
      }
    });
    current.on("close", () => {
      if (socket !== current) {
        return;
      }

      socket = null;
      reconnectTimer = setTimeout(connect, reconnectDelay(attempts));
      attempts += 1;
      set({ status: "connecting", place: null });
    });
  };

  return {
    status: "closed",
    place: null,
    open: (tabSocket = openApiSocket) => {
      get().close();
      openSocket = tabSocket;
      set({ status: "connecting" });
      connect();
    },
    close: () => {
      const current = socket;

      socket = null;
      stopReconnecting();
      set({ status: "closed", place: null });
      current?.close();
    },
  };
});
