import { and, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";

import type { Table } from "../../database/schema";
import type { Relation } from "./model";
import { friendRequest, friendship } from "./schema";
import { type FriendStore, orderedPair } from "./store";

const pairIs = (a: string, b: string) => {
  const [userAId, userBId] = orderedPair(a, b);

  return and(eq(friendship.userAId, userAId), eq(friendship.userBId, userBId));
};

const requestIs = (senderId: string, recipientId: string) =>
  and(eq(friendRequest.senderId, senderId), eq(friendRequest.recipientId, recipientId));

// The production FriendStore. Accepting a request is one transaction.
export const drizzleFriendStore = (db: BunSQLDatabase<Table>): FriendStore => ({
  relationsWith: async (userId, otherIds) => {
    const relations = new Map<string, Relation>();

    if (otherIds.length === 0) {
      return relations;
    }

    const others = [...otherIds];

    const [requests, friendships] = await Promise.all([
      db
        .select({ senderId: friendRequest.senderId, recipientId: friendRequest.recipientId })
        .from(friendRequest)
        .where(
          or(
            and(eq(friendRequest.senderId, userId), inArray(friendRequest.recipientId, others)),
            and(eq(friendRequest.recipientId, userId), inArray(friendRequest.senderId, others)),
          ),
        ),
      db
        .select({ userAId: friendship.userAId, userBId: friendship.userBId })
        .from(friendship)
        .where(
          or(
            and(eq(friendship.userAId, userId), inArray(friendship.userBId, others)),
            and(eq(friendship.userBId, userId), inArray(friendship.userAId, others)),
          ),
        ),
    ]);

    // Weakest first, like the tests' store: a friendship outranks a request, one received outranks
    // one sent.
    for (const { senderId, recipientId } of requests) {
      if (senderId === userId) {
        relations.set(recipientId, "request-sent");
      }
    }

    for (const { senderId, recipientId } of requests) {
      if (recipientId === userId) {
        relations.set(senderId, "request-received");
      }
    }

    for (const { userAId, userBId } of friendships) {
      relations.set(userAId === userId ? userBId : userAId, "friend");
    }

    return relations;
  },
  friendIds: async (userId) => {
    const rows = await db
      .select({ userAId: friendship.userAId, userBId: friendship.userBId })
      .from(friendship)
      .where(or(eq(friendship.userAId, userId), eq(friendship.userBId, userId)));

    return rows.map(({ userAId, userBId }) => (userAId === userId ? userBId : userAId));
  },
  requestsOf: async (userId) => {
    const rows = await db
      .select({ senderId: friendRequest.senderId, recipientId: friendRequest.recipientId })
      .from(friendRequest)
      .where(or(eq(friendRequest.senderId, userId), eq(friendRequest.recipientId, userId)))
      .orderBy(desc(friendRequest.createdAt));

    return {
      received: rows.flatMap((row) => (row.recipientId === userId ? [row.senderId] : [])),
      sent: rows.flatMap((row) => (row.senderId === userId ? [row.recipientId] : [])),
    };
  },
  countFriends: async (userId) => {
    const [row] = await db
      .select({ total: count() })
      .from(friendship)
      .where(or(eq(friendship.userAId, userId), eq(friendship.userBId, userId)));

    return row?.total ?? 0;
  },
  countSentRequests: async (userId) => {
    const [row] = await db
      .select({ total: count() })
      .from(friendRequest)
      .where(eq(friendRequest.senderId, userId));

    return row?.total ?? 0;
  },
  // Under a lock on the pair, held until the commit: of two crossed requests at once, the second
  // sees the first.
  addRequest: async (senderId, recipientId) =>
    db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${orderedPair(senderId, recipientId).join(":")}))`,
      );

      const [crossing] = await tx
        .select({ senderId: friendRequest.senderId })
        .from(friendRequest)
        .where(requestIs(recipientId, senderId));

      if (crossing) {
        return "crossed";
      }

      const inserted = await tx
        .insert(friendRequest)
        .values({ senderId, recipientId })
        .onConflictDoNothing()
        .returning({ senderId: friendRequest.senderId });

      return inserted.length > 0 ? "added" : "exists";
    }),
  deleteRequest: async (senderId, recipientId) => {
    const deleted = await db
      .delete(friendRequest)
      .where(requestIs(senderId, recipientId))
      .returning({ senderId: friendRequest.senderId });

    return deleted.length > 0;
  },
  acceptRequest: async (senderId, recipientId) =>
    db.transaction(async (tx) => {
      const deleted = await tx
        .delete(friendRequest)
        .where(requestIs(senderId, recipientId))
        .returning({ senderId: friendRequest.senderId });

      if (deleted.length === 0) {
        return false;
      }

      const [userAId, userBId] = orderedPair(senderId, recipientId);

      await tx.insert(friendship).values({ userAId, userBId }).onConflictDoNothing();

      return true;
    }),
  deleteFriendship: async (userId, otherId) => {
    const deleted = await db
      .delete(friendship)
      .where(pairIs(userId, otherId))
      .returning({ userAId: friendship.userAId });

    return deleted.length > 0;
  },
  recentFriendshipsOf: async (userIds, limit) => {
    if (userIds.length === 0) {
      return [];
    }

    const ids = [...userIds];

    const rows = await db
      .select()
      .from(friendship)
      .where(or(inArray(friendship.userAId, ids), inArray(friendship.userBId, ids)))
      .orderBy(desc(friendship.createdAt), desc(friendship.userAId), desc(friendship.userBId))
      .limit(limit);

    return rows.map(({ userAId, userBId, createdAt }) => ({
      pair: [userAId, userBId],
      createdAt: createdAt.getTime(),
    }));
  },
});
