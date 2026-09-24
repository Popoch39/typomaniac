import type { Relation } from "./model";

// The Friend requests waiting and the friendships, injected through AppConfig: Drizzle in
// production, in memory in the tests. It only reads and writes: the rules live in the service.
export type FriendStore = {
  // `userId`'s relation with each of `otherIds` that is not `none`.
  relationsWith: (userId: string, otherIds: readonly string[]) => Promise<Map<string, Relation>>;
  friendIds: (userId: string) => Promise<string[]>;
  // The other Users of the requests `userId` received and sent, newest first.
  requestsOf: (userId: string) => Promise<{ received: string[]; sent: string[] }>;
  countFriends: (userId: string) => Promise<number>;
  countSentRequests: (userId: string) => Promise<number>;
  // Written unless this request already waits, or one waits the other way (`crossed`, nothing
  // written: the service accepts it). Atomic per pair: two crossed requests at once never both land.
  addRequest: (senderId: string, recipientId: string) => Promise<"added" | "exists" | "crossed">;
  // False when there was no such request.
  deleteRequest: (senderId: string, recipientId: string) => Promise<boolean>;
  // In one transaction: the request removed, the friendship written. False without the request.
  acceptRequest: (senderId: string, recipientId: string) => Promise<boolean>;
  // False when they were not Friends.
  deleteFriendship: (userId: string, otherId: string) => Promise<boolean>;
};

// A friendship is written once per pair, the smaller id first.
export const orderedPair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);
