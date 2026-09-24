import { Elysia } from "elysia";

import { ApiError } from "../lib/errors";

export const MAX_REQUEST_BODY_SIZE = 1024 * 1024;

// Bun's own limit (listen's maxRequestBodySize). It must stay above ours: Bun rejects
// before Elysia runs, with a bare empty 413. Bodies declared between the two limits get
// the API error format; beyond it, or chunked bodies between the two, only Bun decides.
export const HARD_REQUEST_BODY_SIZE = 4 * MAX_REQUEST_BODY_SIZE;

// Rejects on the declared Content-Length so the client gets the API error format.
export const bodyLimit = new Elysia({ name: "body-limit" })
  .onRequest(({ request }) => {
    const declaredSize = Number(request.headers.get("content-length") ?? 0);

    if (declaredSize > MAX_REQUEST_BODY_SIZE) {
      throw new ApiError("PAYLOAD_TOO_LARGE");
    }
  })
  .as("global");
