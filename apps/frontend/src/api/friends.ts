import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { queryOptions } from "@tanstack/react-query";

import { activityQueryOptions } from "@/api/activity";
import { api, unwrap } from "@/api/client";
import { USER_SEARCH_KEY } from "@/api/user-search";

const fetchFriends = async () => unwrap(await api.friends.get());

const fetchFriendRequests = async () => unwrap(await api["friend-requests"].get());

export type Friend = Awaited<ReturnType<typeof fetchFriends>>[number];

export type FriendRequests = Awaited<ReturnType<typeof fetchFriendRequests>>;

// The signed-in User's Friends, by Handle. Up to date on load and after their own actions.
export const friendsQueryOptions = queryOptions({
  queryKey: ["friends"],
  queryFn: fetchFriends,
});

// The Friend requests the signed-in User received and sent, newest first.
export const friendRequestsQueryOptions = queryOptions({
  queryKey: ["friend-requests"],
  queryFn: fetchFriendRequests,
});

// What one of the User's actions may change: their lists, the relations the search shows, and
// the Activity (a new Friend brings theirs, an ex-Friend takes it away).
export const FRIEND_QUERY_KEYS = [
  friendsQueryOptions.queryKey,
  friendRequestsQueryOptions.queryKey,
  USER_SEARCH_KEY,
  activityQueryOptions.queryKey,
] as const;

// Each action on the other User answers where the signed-in User then stands with them.
const send = async (userId: string) => unwrap(await api["friend-requests"].post({ userId }));

const cancel = async (userId: string) =>
  unwrap(await api["friend-requests"].sent({ userId }).delete());

const accept = async (userId: string) =>
  unwrap(await api["friend-requests"].received({ userId }).accept.post());

const decline = async (userId: string) =>
  unwrap(await api["friend-requests"].received({ userId }).delete());

const remove = async (userId: string) => unwrap(await api.friends({ userId }).delete());

export const friendActions = { send, cancel, accept, decline, remove };

export type FriendAction = keyof typeof friendActions;

// A refused action: the API puts the rule broken in the error's details, like a refused Handle.
const FriendRefused = Type.Object({
  error: Type.Object({
    details: Type.Tuple([Type.Object({ path: Type.Literal("/userId"), message: Type.String() })]),
  }),
});

// The rule an action broke, as the API names it; null for any other error.
export const friendRefusalOf = (body: Parameters<typeof Value.Check>[1]) =>
  Value.Check(FriendRefused, body) ? body.error.details[0].message : null;
