import { createApp } from "./app";
import { db, runMigrations } from "./database/client";
import { env } from "./env";
import { systemClock } from "./lib/clock";
import { createLogger } from "./lib/logger";
import { createAuth } from "./modules/auth/service";
import { drizzleBestRunStore } from "./modules/best-run/drizzle-store";
import { drizzleDuelStore } from "./modules/duel/drizzle-store";
import { drizzleFriendStore } from "./modules/friend/drizzle-store";
import { photoUrlOn } from "./modules/photo/avatar";
import { bunPhotoCodec } from "./modules/photo/bun-codec";
import { s3PhotoStore } from "./modules/photo/s3-store";
import { drizzleHandleSearch } from "./modules/user/drizzle-handle-search";
import { authUsers } from "./modules/user/users";
import { HARD_REQUEST_BODY_SIZE } from "./plugins/body-limit";

const isProduction = env.NODE_ENV === "production";

// Per User: a search per pause in the typing (debounced), far from enough to dump the Handles.
const SEARCH_RATE_LIMIT = { max: 30, windowMs: 60_000 };

// Per User: a few Friend requests in a row are fine, spraying them at everyone is not.
const FRIEND_REQUEST_RATE_LIMIT = { max: 20, windowMs: 60_000 };

// Per User: a few tries to get the framing right, not a stream of images to decode.
const PHOTO_RATE_LIMIT = { max: 10, windowMs: 60 * 60_000 };

const logger = createLogger({ level: env.LOG_LEVEL, pretty: !isProduction });

const photoStore = env.photoStorage === null ? null : s3PhotoStore(env.photoStorage);

const photoUrl = photoUrlOn(env.BETTER_AUTH_URL);

if (photoStore === null) {
  logger.warn("no S3 storage configured: Photos can be neither sent nor served");
}

try {
  await runMigrations();
} catch (error) {
  logger.fatal({ err: error }, "migrations failed");
  process.exit(1);
}

const auth = createAuth(
  {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigin: env.CORS_ORIGIN,
    socialProviders: env.socialProviders,
    isProduction,
    photoStore,
  },
  db,
);

const app = createApp({
  corsOrigin: env.CORS_ORIGIN,
  isProduction,
  trustProxy: env.TRUST_PROXY,
  rateLimit: { max: env.RATE_LIMIT_MAX, windowMs: env.RATE_LIMIT_WINDOW_MS },
  logger,
  auth,
  users: authUsers(auth, { searchHandles: drizzleHandleSearch(db), photoUrl }),
  clock: systemClock,
  duelStore: drizzleDuelStore(db),
  searchRateLimit: SEARCH_RATE_LIMIT,
  friendStore: drizzleFriendStore(db),
  friendRequestRateLimit: FRIEND_REQUEST_RATE_LIMIT,
  bestRunStore: drizzleBestRunStore(db),
  photoStore,
  photoCodec: bunPhotoCodec,
  photoUrl,
  photoRateLimit: PHOTO_RATE_LIMIT,
}).listen({ port: env.PORT, maxRequestBodySize: HARD_REQUEST_BODY_SIZE });

logger.info({ url: app.server?.url.href }, "server started");
