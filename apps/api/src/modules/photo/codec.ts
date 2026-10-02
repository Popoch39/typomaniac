// What an image's header says of it, before any pixel is decoded.
export type ImageHeader = { width: number; height: number; format: string };

// Reads and encodes the images sent: Bun.Image in production and in the tests (bun-codec.ts),
// injected so app.ts' graph, which the front typechecks without Bun's types, never names Bun.
export type PhotoCodec = {
  // Null when the bytes are not an image Bun knows.
  header: (bytes: Uint8Array) => Promise<ImageHeader | null>;
  // Decoded (at most `maxPixels`), resized to a `side` square and encoded as WebP; null when the
  // pixels do not decode.
  webp: (
    bytes: Uint8Array,
    options: { side: number; quality: number; maxPixels: number },
  ) => Promise<Uint8Array | null>;
};
