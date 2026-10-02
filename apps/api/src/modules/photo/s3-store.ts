import { S3Client } from "bun";

import type { PhotoStorage } from "../../parse-env";
import type { PhotoStore } from "./store";

// The Photos on an S3 storage, SeaweedFS in production (ADR 0018), path-style (`virtualHostedStyle`
// off, Bun's default) as SeaweedFS serves its buckets. Checked by hand on the dev SeaweedFS, like
// the Drizzle stores: the tests keep the Photos in memory.
export const s3PhotoStore = (storage: PhotoStorage): PhotoStore => {
  const client = new S3Client(storage);

  return {
    put: async (key, bytes) => {
      await client.write(key, bytes, { type: "image/webp" });
    },
    // Read into a plain Blob: Bun answers `new Response(s3File)` with a redirect to a presigned URL,
    // and refuses the headers of a Photo; the bucket stays private behind the API.
    get: async (key) => {
      const file = client.file(key);

      return (await file.exists()) ? new Blob([await file.arrayBuffer()]) : null;
    },
    delete: (key) => client.delete(key),
  };
};
