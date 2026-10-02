import type { PhotoCodec } from "./codec";

// Bun.Image: JPEG, PNG and WebP through codecs built into Bun, no native module (ADR 0018). Its
// errors carry codes (ERR_IMAGE_*), all read here as "not an image".
export const bunPhotoCodec: PhotoCodec = {
  header: (bytes) => new Bun.Image(bytes).metadata().catch(() => null),
  webp: (bytes, { side, quality, maxPixels }) =>
    new Bun.Image(bytes, { maxPixels })
      .resize(side, side)
      .webp({ quality })
      .bytes()
      .catch(() => null),
};
