import type { Logger } from "pino";

import { ApiError } from "../../lib/errors";
import type { Users } from "../user/users";
import type { PhotoCodec } from "./codec";
import type { PhotoStore } from "./store";

// The side of a kept Photo: twice the largest Avatar the front shows, for dense screens.
const PHOTO_SIDE = 512;

// The square the browser sends: cropped by it to at most this side, never under the smaller one
// (MIN_SENT_SIDE and MAX_SENT_SIDE of the front's photo-crop.ts, kept the same).
const MIN_SENT_SIDE = 128;

const MAX_SENT_SIDE = 1024;

const PHOTO_QUALITY = 85;

// GIF is left out: Bun would keep its first frame only, an animated Avatar would freeze.
const SENT_FORMATS = new Set(["jpeg", "png", "webp"]);

export type PhotoRefusal = "not-an-image" | "not-square" | "too-small" | "too-large";

// `log` for an old Photo the store failed to erase: the User's change is made all the same.
export type PhotoDeps = { store: PhotoStore; codec: PhotoCodec; users: Users; log: Logger };

const refused = (reason: PhotoRefusal) =>
  new ApiError("VALIDATION_FAILED", "This Photo is refused", [{ path: "/photo", message: reason }]);

// Only the header is read: the pixels are decoded once the size is known to be fine.
const checkSentSquare = async (codec: PhotoCodec, bytes: Uint8Array) => {
  const header = await codec.header(bytes);

  if (header === null || !SENT_FORMATS.has(header.format)) {
    throw refused("not-an-image");
  }

  if (header.width !== header.height) {
    throw refused("not-square");
  }

  if (header.width < MIN_SENT_SIDE) {
    throw refused("too-small");
  }

  if (header.width > MAX_SENT_SIDE) {
    throw refused("too-large");
  }
};

// Decoded then encoded again: the pixels of a header that lied are refused, and the metadata
// (EXIF, GPS) of the file sent never reaches the store.
const encodePhoto = async (codec: PhotoCodec, bytes: Uint8Array) => {
  await checkSentSquare(codec, bytes);

  const encoded = await codec.webp(bytes, {
    side: PHOTO_SIDE,
    quality: PHOTO_QUALITY,
    maxPixels: MAX_SENT_SIDE ** 2,
  });

  if (encoded === null) {
    throw refused("not-an-image");
  }

  return encoded;
};

// Makes `key` the User's Photo (null: none), then erases the one it replaces. Erased last: a
// failure before leaves the User their Photo, a failure of the erasing leaves a file unread.
const replacePhoto = async (
  { store, users, log }: PhotoDeps,
  userId: string,
  key: string | null,
) => {
  const replaced = await users.photoOf(userId);

  await users.setPhoto(userId, key);

  if (replaced !== null) {
    await store.delete(replaced).catch((error: Error) => {
      log.warn({ err: error, key: replaced }, "photo not erased");
    });
  }
};

// Keeps the Photo under a new key, then makes it the User's.
export const setPhoto = async (deps: PhotoDeps, userId: string, bytes: Uint8Array) => {
  const encoded = await encodePhoto(deps.codec, bytes);
  const key = `${userId}/${crypto.randomUUID()}.webp`;

  await deps.store.put(key, encoded);
  await replacePhoto(deps, userId, key);
};

// Back to the provider's image, or to the initials without one.
export const removePhoto = (deps: PhotoDeps, userId: string) => replacePhoto(deps, userId, null);
