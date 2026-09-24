import pino, { type LevelWithSilent } from "pino";

// JSON on stdout in production (for the log collector); human-readable in dev.
// pino-pretty runs as a transport worker, which the compiled production binary
// cannot load: it must stay dev-only.
export const createLogger = ({ level, pretty }: { level: LevelWithSilent; pretty: boolean }) =>
  pino({
    level,
    // Safety net if a handler logs headers or a body as-is.
    redact: ["*.authorization", "*.cookie", '*["set-cookie"]', "*.password"],
    transport: pretty ? { target: "pino-pretty" } : undefined,
  });
