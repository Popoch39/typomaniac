import { sql } from "drizzle-orm";
import { check, index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../../database/auth-schema";

// A Friend request waiting for its answer: one per sender and recipient. Accepted, declined or
// cancelled, it is deleted.
export const friendRequest = pgTable(
  "friend_request",
  {
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.senderId, table.recipientId] }),
    index("friend_request_recipientId_idx").on(table.recipientId),
  ],
);

// Two Friends, once per pair: the smaller id in `user_a_id`.
export const friendship = pgTable(
  "friendship",
  {
    userAId: text("user_a_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userBId: text("user_b_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userAId, table.userBId] }),
    index("friendship_userBId_idx").on(table.userBId),
    check("friendship_ordered_pair", sql`${table.userAId} < ${table.userBId}`),
  ],
);
