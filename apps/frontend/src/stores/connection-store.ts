import type { ClientMessage, Presence, ServerMessage } from "api";
import { create } from "zustand";

import { api } from "@/api/client";
import { type Arrival, arrivalsAfter } from "@/lib/activity-feed";

// The User's place as the server tells this connection: none, or in the Queue or a Duel, played
// here or not (another tab holds it, or none does while they come back to their Duel). The Queue
// played elsewhere says since when they wait, on this tab's clock (`Date.now()`): this tab shows
// it too.
type Elsewhere = Extract<ServerMessage, { type: "elsewhere" }>;

export type Place =
  | { at: "idle" }
  | { at: Elsewhere["place"]; here: true }
  | { at: Extract<Elsewhere, { place: "duel" }>["place"]; here: false }
  | { at: Extract<Elsewhere, { place: "queue" }>["place"]; here: false; joinedAt: number };

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

// The Queue as Jouer shows it before joining: how many Users wait in it, and the Estimated wait in
// ms (null without a recent pairing).
export type QueueOverview = Pick<
  Extract<ServerMessage, { type: "queue-overview" }>,
  "size" | "estimatedWait"
>;

type ConnectionStore = {
  status: ConnectionStatus;
  // Unknown until the server tells it on each new socket.
  place: Place | null;
  // Kept through a lost connection: the server tells it again with the place.
  queueLock: KnownQueueLock;
  // Unknown until the server tells it to a tab that watches Jouer, while the User is out of the
  // Queue.
  queueOverview: QueueOverview | null;
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

export type OpenLiveSocket = () => LiveSocket;

export const openApiSocket: OpenLiveSocket = () => api.duel.subscribe();

// The place after a message, `now` read when it arrived: the connection that plays it learns it
// from its own messages, the others from `idle` and `elsewhere`. The server's join time is shifted
// onto this tab's clock as a Challenge's expiry is.
export const placeAfter = (
  place: Place | null,
  message: ServerMessage,
  now: number,
): Place | null => {
  switch (message.type) {
    case "idle":
    case "duel-ended":
      return { at: "idle" };
    case "elsewhere":
      return message.place === "queue"
        ? { at: "queue", here: false, joinedAt: message.joinedAt - message.serverTime + now }
        : { at: "duel", here: false };
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

// The User's Queue lock as this connection learns it: its end on this tab's clock (`Date.now()`),
// null without one; and how far the server's clock is behind this tab's, as the last Match
// proposal told it, for the lock its Dodge imposes.
export type KnownQueueLock = { until: number | null; serverOffset: number };

// The Queue lock after a message, `now` read when it arrived: told with the place (`idle`) and as
// the Queue is refused (`queue-locked`), imposed by a Dodge here (`proposal-ended`, which tells no
// time of its own: the Match proposal's shift). Over once the User is in the Queue again.
export const queueLockAfter = (
  lock: KnownQueueLock,
  message: ServerMessage,
  now: number,
): KnownQueueLock => {
  switch (message.type) {
    case "idle":
      return {
        ...lock,
        until:
          message.queueLockedUntil === null
            ? null
            : message.queueLockedUntil - message.serverTime + now,
      };
    case "queue-locked":
      return { ...lock, until: message.until - message.serverTime + now };
    case "match-proposed":
      return { until: null, serverOffset: now - message.serverTime };
    case "queued":
      return { ...lock, until: null };
    case "proposal-ended":
      return message.reason === "declined" || message.reason === "missed"
        ? {
            ...lock,
            until:
              message.queueLockedUntil === null
                ? null
                : message.queueLockedUntil + lock.serverOffset,
          }
        : lock;
    default:
      return lock;
  }
};

const NO_QUEUE_LOCK: KnownQueueLock = { until: null, serverOffset: 0 };

// The overview after a message, `place` the one it leads to: told while the User is out of the
// Queue, forgotten once it is their place (here or in another tab), told again once they leave it.
export const queueOverviewAfter = (
  overview: QueueOverview | null,
  message: ServerMessage,
  place: Place | null,
): QueueOverview | null => {
  if (place?.at === "queue") {
    return null;
  }

  return message.type === "queue-overview"
    ? { size: message.size, estimatedWait: message.estimatedWait }
    : overview;
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

// A Challenge sent or received waits for its answer: a Duel may start.
export const hasPendingChallenge = (challenges: LiveChallenges | null) =>
  challenges !== null && (challenges.sent !== null || challenges.received.length > 0);

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

      const now = Date.now();

      attempts = 0;

      const place = placeAfter(get().place, data, now);

      set({
        status: "open",
        place,
        queueLock: queueLockAfter(get().queueLock, data, now),
        queueOverview: queueOverviewAfter(get().queueOverview, data, place),
        friends: friendsAfter(get().friends, data),
        challenges: challengesAfter(get().challenges, data, now),
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
      set({
        status: "connecting",
        place: null,
        queueOverview: null,
        friends: null,
        challenges: null,
      });
    });
  };

  return {
    status: "closed",
    place: null,
    queueLock: NO_QUEUE_LOCK,
    queueOverview: null,
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
      set({
        status: "closed",
        place: null,
        queueLock: NO_QUEUE_LOCK,
        queueOverview: null,
        friends: null,
        challenges: null,
        arrivals: [],
      });
      current?.close();
    },
  };
});
