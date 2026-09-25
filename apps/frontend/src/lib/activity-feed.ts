import type { ServerMessage } from "api";

import type { Activity } from "@/api/activity";

// A Friend who just came online: told by the real-time connection only, never read.
export type Arrival = Extract<ServerMessage, { type: "friend-arrived" }>["arrival"];

// As many Activities as the API gives: the newest.
export const ACTIVITY_FEED_SIZE = 50;

// The Activity just told by the real-time connection, first: once, in place of the one read
// before under the same id, the feed cut to its size.
export const withActivity = (feed: readonly Activity[], activity: Activity): Activity[] =>
  firstOnce(feed, activity);

const firstOnce = <T extends { id: string }>(feed: readonly T[], item: T): T[] =>
  [item, ...feed.filter((other) => other.id !== item.id)].slice(0, ACTIVITY_FEED_SIZE);

// The arrivals after a message of the server: a new one first, once, cut to the feed's size; an
// ex-Friend's go with the friendship.
export const arrivalsAfter = (
  arrivals: readonly Arrival[],
  message: ServerMessage,
): readonly Arrival[] => {
  if (message.type === "friend-arrived") {
    return firstOnce(arrivals, message.arrival);
  }

  if (message.type === "friend-removed") {
    return arrivals.filter((arrival) => arrival.friend.id !== message.userId);
  }

  return arrivals;
};

type FeedItem = { kind: "activity"; activity: Activity } | { kind: "arrival"; arrival: Arrival };

// The Activities read and the arrivals told since, together, the newest first, cut to the size.
export const feedItems = (
  activities: readonly Activity[],
  arrivals: readonly Arrival[],
): FeedItem[] =>
  [
    ...activities.map((activity): FeedItem => ({ kind: "activity", activity })),
    ...arrivals.map((arrival): FeedItem => ({ kind: "arrival", arrival })),
  ]
    .toSorted((a, b) => atOf(b) - atOf(a))
    .slice(0, ACTIVITY_FEED_SIZE);

const atOf = (item: FeedItem) => (item.kind === "activity" ? item.activity.at : item.arrival.at);
