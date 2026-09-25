import type { Activity } from "@/api/activity";

// As many Activities as the API gives: the newest.
export const ACTIVITY_FEED_SIZE = 50;

// The Activity just told by the real-time connection, first: once, in place of the one read
// before under the same id, the feed cut to its size.
export const withActivity = (feed: readonly Activity[], activity: Activity): Activity[] =>
  [activity, ...feed.filter((other) => other.id !== activity.id)].slice(0, ACTIVITY_FEED_SIZE);
