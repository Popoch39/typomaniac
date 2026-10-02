import { type Context, Elysia } from "elysia";
import type { Logger } from "pino";

import { ApiError } from "../../lib/errors";
import { keyedRateLimit, type RateLimit } from "../../plugins/rate-limit";
import { type AuthHandler, authentication, readSession } from "../auth";
import type { DuelStore } from "../duel/store";
import { MeModel } from "../me/model";
import { meOf } from "../me/service";
import type { Users } from "../user/users";
import { PHOTOS_ROUTE, type PhotoUrl } from "./avatar";
import { PhotoModel } from "./model";
import { removePhoto, setPhoto } from "./service";
import type { PhotoCodec } from "./codec";
import type { PhotoStore } from "./store";

export type PhotoModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  users: Users;
  duelStore: DuelStore;
  // Null when the storage is not configured: nothing is sent nor served.
  store: PhotoStore | null;
  codec: PhotoCodec;
  photoUrl: PhotoUrl;
  logger: Logger;
  sendRateLimit: RateLimit;
};

// A key never changes its bytes (ADR 0018): browsers and proxies keep it for a year.
const PHOTO_HEADERS = {
  "content-type": "image/webp",
  "cache-control": "public, max-age=31536000, immutable",
};

export const photoModule = ({
  auth,
  trustProxy,
  users,
  duelStore,
  store,
  codec,
  photoUrl,
  logger,
  sendRateLimit,
}: PhotoModuleConfig) => {
  const countSending = keyedRateLimit(sendRateLimit);

  const depsOf = () => {
    if (store === null) {
      throw new ApiError("SERVICE_UNAVAILABLE");
    }

    return { store, codec, users, log: logger };
  };

  // The User as /api/me shows them, read again from the database: the Session is cached again with
  // their new Avatar.
  const meAgain = async (request: Request, set: Context["set"]) =>
    meOf(
      { store: duelStore, photoUrl },
      (await readSession(auth, request, set, { fresh: true })).user,
    );

  return (
    new Elysia({ name: "photo", seed: store })
      .use(authentication(auth, { trustProxy }))
      // Sends the User's Photo, the square they framed: it becomes their Avatar. The Session is cached
      // again with it.
      .put(
        "/me/photo",
        async ({ user, body, request, set }) => {
          const deps = depsOf();

          countSending(user.id, set);
          await setPhoto(deps, user.id, await body.photo.bytes());

          return meAgain(request, set);
        },
        {
          auth: true,
          body: PhotoModel.input,
          response: MeModel.me,
          detail: { summary: "Sends the signed-in User's Photo", tags: ["Profile"] },
        },
      )
      // Removes the User's Photo: their Avatar is their provider's image again, or their initials.
      .delete(
        "/me/photo",
        async ({ user, request, set }) => {
          await removePhoto(depsOf(), user.id);

          return meAgain(request, set);
        },
        {
          auth: true,
          response: MeModel.me,
          detail: { summary: "Removes the signed-in User's Photo", tags: ["Profile"] },
        },
      )
      // A Photo, by the key in its URL: public, as the Avatars are wherever a Visitor sees them.
      .get(
        `${PHOTOS_ROUTE}/:userId/:file`,
        async ({ params }) => {
          const photo = store === null ? null : await store.get(`${params.userId}/${params.file}`);

          if (photo === null) {
            throw new ApiError("NOT_FOUND");
          }

          return new Response(photo, { headers: PHOTO_HEADERS });
        },
        {
          params: PhotoModel.key,
          response: PhotoModel.photo,
          detail: { summary: "A Photo, as a WebP image", tags: ["Profile"] },
        },
      )
  );
};
