import { Elysia } from "elysia";

const HEADER = "x-request-id";

// Reused from the client (or an upstream proxy) only if it cannot inject anything into logs.
const VALID_INCOMING_ID = /^[\w.-]{1,128}$/;

// Keyed by Request rather than derived on the context: derive does not run for
// errors raised before routing (404, parse errors), and those need the id too.
const ids = new WeakMap<Request, string>();

const resolveId = (incoming: string | null) =>
  incoming !== null && VALID_INCOMING_ID.test(incoming) ? incoming : crypto.randomUUID();

export const requestIdOf = (request: Request) => ids.get(request) ?? "unknown";

export const requestId = new Elysia({ name: "request-id" })
  .onRequest(({ request, set }) => {
    const id = resolveId(request.headers.get(HEADER));

    ids.set(request, id);
    set.headers[HEADER] = id;
  })
  .as("global");
