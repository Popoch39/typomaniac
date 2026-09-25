import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import type { Logger } from "pino";

import { API_PREFIX } from "./lib/api-prefix";
import type { Clock } from "./lib/clock";
import { activityModule } from "./modules/activity";
import { type AuthHandler, authentication } from "./modules/auth";
import { duelModule } from "./modules/duel";
import { MAX_DUEL_MESSAGE_SIZE } from "./modules/duel/model";
import { DuelQueue } from "./modules/duel/service";
import type { DuelStore } from "./modules/duel/store";
import { duelHistoryModule } from "./modules/duel-history";
import { friendModule } from "./modules/friend";
import { type FriendEvents, FriendsLive } from "./modules/friend/live";
import type { FriendStore } from "./modules/friend/store";
import { handleModule } from "./modules/handle";
import { meModule } from "./modules/me";
import { profileModule } from "./modules/profile";
import { userModule } from "./modules/user";
import type { Users } from "./modules/user/users";
import { apiDocs } from "./plugins/api-docs";
import { bodyLimit } from "./plugins/body-limit";
import { errorHandler } from "./plugins/error-handler";
import { type RateLimit, rateLimit } from "./plugins/rate-limit";
import { requestId } from "./plugins/request-id";
import { requestLogger } from "./plugins/request-logger";
import { securityHeaders } from "./plugins/security-headers";

export type { ApiErrorBody, ErrorCode, ErrorDetail } from "./lib/errors";

export type { ClientMessage, ServerMessage } from "./modules/duel/model";

export type { FriendRefusal, Presence } from "./modules/friend/model";

export type { Activity } from "./modules/activity/model";

export type { ChallengeEnding, ChallengeRefusal } from "./modules/challenge/model";

export type AppConfig = {
  corsOrigin: string;
  isProduction: boolean;
  trustProxy: boolean;
  rateLimit: { max: number; windowMs: number };
  logger: Logger;
  // Built by the entry point (src/modules/auth/service.ts) from the env, like the logger.
  auth: AuthHandler;
  // The Users past the Session (Handles, profiles): on the auth's database.
  users: Users;
  // The Duel's time source (Countdown, server time sent to the clients).
  clock: Clock;
  // Where finished Duels are written: Drizzle in production, in memory in the tests.
  duelStore: DuelStore;
  // Per User, stricter than the global limit: the search must not dump the Handles.
  searchRateLimit: RateLimit;
  // The Friend requests and the friendships: Drizzle in production, in memory in the tests.
  friendStore: FriendStore;
  // Per User, on sending a Friend request: nobody sprays them at everyone.
  friendRequestRateLimit: RateLimit;
};

// Order matters: headers and the request id are set before anything can throw, and
// the error handler is registered before the plugins that reject requests. The docs
// come after the security headers: they loosen the CSP on their own page. The prefix
// also applies to the routes of the plugins used here (the docs). The feature modules
// come last, each one from src/modules/.
export const createApp = (config: AppConfig) => {
  const { auth, trustProxy, users, duelStore, friendStore } = config;

  // The Presence and the live Friend events, in memory: told by the Friend routes once they wrote,
  // and by the Duel socket of each connection and each Duel.
  const friendsLive = new FriendsLive({
    store: friendStore,
    users,
    clock: config.clock,
    logger: config.logger,
  });

  // The Queue, the Duels and the Challenges, in memory: each Duel is a Presence for the Friends,
  // and once written an Activity.
  const duelQueue = new DuelQueue({
    clock: config.clock,
    store: duelStore,
    users,
    friendStore,
    logger: config.logger,
    onDuel: (userId, inDuel) => friendsLive.setInDuel(userId, inDuel),
    onDuelSaved: (record) => friendsLive.duelSaved(record),
  });

  // The Friend routes tell both: an ended friendship also ends the Challenges between the two.
  const friendEvents: FriendEvents = {
    requestSent: (senderId, recipientId) => friendsLive.requestSent(senderId, recipientId),
    requestRemoved: (senderId, recipientId) => friendsLive.requestRemoved(senderId, recipientId),
    friendsAdded: (a, b) => friendsLive.friendsAdded(a, b),
    friendsRemoved: (a, b) => {
      friendsLive.friendsRemoved(a, b);
      duelQueue.friendsRemoved(a, b);
    },
  };

  return new Elysia({
    prefix: API_PREFIX,
    websocket: { maxPayloadLength: MAX_DUEL_MESSAGE_SIZE },
  })
    .use(requestId)
    .use(requestLogger(config.logger))
    .use(securityHeaders({ isProduction: config.isProduction }))
    .use(cors({ origin: config.corsOrigin, credentials: true }))
    .use(apiDocs({ enabled: !config.isProduction, auth }))
    .use(errorHandler(config.logger))
    .use(bodyLimit)
    .use(rateLimit({ ...config.rateLimit, trustProxy }))
    .get("/health", () => ({ status: "ok" as const }), {
      response: t.Object({ status: t.Literal("ok") }),
      detail: { summary: "Health check", tags: ["System"] },
    })
    .use(authentication(auth, { trustProxy }))
    .use(meModule({ auth, trustProxy, duelStore }))
    .use(handleModule({ auth, trustProxy, users }))
    .use(
      userModule({
        auth,
        trustProxy,
        users,
        friendStore,
        searchRateLimit: config.searchRateLimit,
      }),
    )
    .use(
      friendModule({
        auth,
        trustProxy,
        users,
        store: friendStore,
        events: friendEvents,
        sendRateLimit: config.friendRequestRateLimit,
      }),
    )
    .use(duelHistoryModule({ auth, trustProxy, store: duelStore, users }))
    .use(profileModule({ auth, trustProxy, store: duelStore, users }))
    .use(activityModule({ auth, trustProxy, duelStore, friendStore, users }))
    .use(duelModule({ auth, trustProxy, queue: duelQueue, friendsLive }));
};

export type App = ReturnType<typeof createApp>;
