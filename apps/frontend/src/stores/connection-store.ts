import type { ClientMessage, Presence, ServerMessage } from "api";
import { create } from "zustand";

import { api } from "@/api/client";
import { type Arrival, arrivalsAfter } from "@/lib/activity-feed";

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

// What the server tells of the User's Friends: each one's Presence (a Friend missing from it is
// offline), and how many Friend requests wait for the User's answer.
export type LiveFriends = {
  presences: ReadonlyMap<string, Presence>;
  requestsReceived: number;
};

type Snapshot = Extract<ServerMessage, { type: "challenges-snapshot" }>;

// A Challenge waiting, its expiry on this tab's clock (`Date.now()`).
export type SentChallenge = NonNullable<Snapshot["sent"]>;

export type ReceivedChallenge = Snapshot["received"][number];

// The User's Challenges waiting: the one they sent, and those they received.
export type LiveChallenges = {
  sent: SentChallenge | null;
  received: readonly ReceivedChallenge[];
};

type ConnectionStore = {
  status: ConnectionStatus;
  // Unknown until the server tells it on each new socket.
  place: Place | null;
  // Unknown until the snapshot of each new socket.
  friends: LiveFriends | null;
  // Unknown until the snapshot of each new socket.
  challenges: LiveChallenges | null;
  // The Friends who came online since the tab opened, the newest first: kept through a lost
  // connection, forgotten on reload or sign-out.
  arrivals: readonly Arrival[];
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
    // A Match proposal is still the Queue's, until the Duel is found.
    case "queued":
    case "match-proposed":
      return { at: "queue", here: true };
    // Declined or let run out by the User: out of the Queue. Accepted, or by the opponent: the
    // Queue's still.
    case "proposal-ended":
      return message.reason === "declined" || message.reason === "missed" ? { at: "idle" } : place;
    case "duel-found":
    case "duel-resumed":
      return { at: "duel", here: true };
    default:
      return place;
  }
};

const withPresence = (friends: LiveFriends, userId: string, presence: Presence | null) => {
  const presences = new Map(friends.presences);

  if (presence === null) {
    presences.delete(userId);
  } else {
    presences.set(userId, presence);
  }

  return presences;
};

// The Friends after a message: the snapshot sets them, the changes that follow update them. A
// change before the snapshot is left to it: the snapshot is sent after it.
export const friendsAfter = (
  friends: LiveFriends | null,
  message: ServerMessage,
): LiveFriends | null => {
  if (message.type === "friends-snapshot") {
    return {
      presences: new Map(message.presences.map(({ userId, presence }) => [userId, presence])),
      requestsReceived: message.requestsReceived,
    };
  }

  if (friends === null) {
    return null;
  }

  switch (message.type) {
    case "presence":
      return { ...friends, presences: withPresence(friends, message.userId, message.presence) };
    case "friend-request-received":
    case "friend-request-removed":
      return { ...friends, requestsReceived: message.requestsReceived };
    case "friend-added":
      return {
        presences: withPresence(friends, message.userId, message.presence),
        requestsReceived: message.requestsReceived,
      };
    case "friend-removed":
      return { ...friends, presences: withPresence(friends, message.userId, null) };
    default:
      return friends;
  }
};

// The server's expiry shifted to this tab's clock, `now` read when its message arrived. The offset
// lags by the message's delay: the time left shown never ends late.
const localExpiry = <T extends { expiresAt: number }>(
  challenge: T,
  serverTime: number,
  now: number,
) => ({
  ...challenge,
  expiresAt: challenge.expiresAt - serverTime + now,
});

// The Challenges after a message: the snapshot sets them, the changes that follow update them.
export const challengesAfter = (
  challenges: LiveChallenges | null,
  message: ServerMessage,
  now: number,
): LiveChallenges | null => {
  if (message.type === "challenges-snapshot") {
    return {
      sent: message.sent === null ? null : localExpiry(message.sent, message.serverTime, now),
      received: message.received.map((challenge) =>
        localExpiry(challenge, message.serverTime, now),
      ),
    };
  }

  if (challenges === null) {
    return null;
  }

  switch (message.type) {
    case "challenge-received":
      return {
        ...challenges,
        received: [...challenges.received, localExpiry(message.challenge, message.serverTime, now)],
      };
    case "challenge-sent":
      return { ...challenges, sent: localExpiry(message.challenge, message.serverTime, now) };
    case "challenge-ended":
      return {
        sent: challenges.sent?.id === message.challengeId ? null : challenges.sent,
        received: challenges.received.filter(({ id }) => id !== message.challengeId),
      };
    default:
      return challenges;
  }
};

// What the Friends page reads over HTTP and a message says changed: the lists, the relations of
// the search. A snapshot too: things may have changed while the connection was lost.
export const changesFriendLists = (message: ServerMessage) =>
  message.type === "friends-snapshot" ||
  message.type === "friend-request-received" ||
  message.type === "friend-request-removed" ||
  message.type === "friend-added" ||
  message.type === "friend-removed";

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

// Dropped until the server has spoken on the current socket (one still opening throws on send):
// whoever sends learns the state again from the server once back.
export const sendToServer = (message: ClientMessage) => {
  if (useConnectionStore.getState().status === "open") {
    socket?.send(message);
  }
};

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
      set({
        status: "open",
        place: placeAfter(get().place, data),
        friends: friendsAfter(get().friends, data),
        challenges: challengesAfter(get().challenges, data, Date.now()),
        arrivals: arrivalsAfter(get().arrivals, data),
      });

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
      set({ status: "connecting", place: null, friends: null, challenges: null });
    });
  };

  return {
    status: "closed",
    place: null,
    friends: null,
    challenges: null,
    arrivals: [],
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
      set({ status: "closed", place: null, friends: null, challenges: null, arrivals: [] });
      current?.close();
    },
  };
});
