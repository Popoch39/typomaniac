// Where the Photos are kept, by key, encoded once and never changed under the same key (ADR 0018):
// SeaweedFS through Bun's S3 client in production, in memory in the tests.
export type PhotoStore = {
  put: (key: string, bytes: Uint8Array) => Promise<void>;
  // Null when no Photo is kept under this key.
  get: (key: string) => Promise<Blob | null>;
  // Nothing happens for a key already gone.
  delete: (key: string) => Promise<void>;
};
