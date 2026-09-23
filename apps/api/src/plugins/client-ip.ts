// The header the authentication plugin writes the client IP to, the only one Better
// Auth reads it from. Always overwritten: a client-sent copy never reaches it.
export const CLIENT_IP_HEADER = "x-typomaniac-client-ip";

type Server = { requestIP: (request: Request) => { address: string } | null } | null;

// Behind a reverse proxy every request comes from the proxy's address: the client IP
// must be read from X-Forwarded-For. Never trust it otherwise, anyone can forge it.
// server is null outside a real server (app.handle in tests): an empty string.
export const clientIp = (request: Request, server: Server, trustProxy: boolean) => {
  const forwardedFor = trustProxy
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : undefined;

  return forwardedFor || (server?.requestIP(request)?.address ?? "");
};
