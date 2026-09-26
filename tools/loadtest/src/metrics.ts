import { readFileSync } from "node:fs";

// Latencies in 1 ms buckets up to MAX_MS: constant cost per sample, whatever the rate.
const MAX_MS = 10_000;

export const createHistogram = () => {
  let buckets = new Uint32Array(MAX_MS + 1);
  let count = 0;

  const record = (ms: number) => {
    const bucket = Math.min(MAX_MS, Math.max(0, Math.round(ms)));

    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    count += 1;
  };

  const percentile = (p: number) => {
    if (count === 0) {
      return null;
    }

    const target = Math.ceil(count * p);
    let seen = 0;

    for (let ms = 0; ms <= MAX_MS; ms++) {
      seen += buckets[ms] ?? 0;

      if (seen >= target) {
        return ms;
      }
    }

    return MAX_MS;
  };

  // The percentiles since the last reset, then starts over.
  const drain = () => {
    const summary = { count, p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) };

    buckets = new Uint32Array(MAX_MS + 1);
    count = 0;

    return summary;
  };

  return { record, drain };
};

export type Histogram = ReturnType<typeof createHistogram>;

// Everything the bots count, running totals since the start.
const COUNTER_NAMES = [
  "connected",
  "connectFailures",
  "unexpectedCloses",
  "sent",
  "received",
  "invalidMessages",
  "resyncs",
  "duelsStarted",
  "duelsEnded",
  "duelsUnwritten",
  "forfeits",
  "challengesSent",
  "challengesAccepted",
  "friendPushes",
  "activityPushes",
  "httpRequests",
  "httpErrors",
] as const;

export type Counters = Record<(typeof COUNTER_NAMES)[number], number>;

export const createCounters = (): Counters => ({
  connected: 0,
  connectFailures: 0,
  unexpectedCloses: 0,
  sent: 0,
  received: 0,
  invalidMessages: 0,
  resyncs: 0,
  duelsStarted: 0,
  duelsEnded: 0,
  duelsUnwritten: 0,
  forfeits: 0,
  challengesSent: 0,
  challengesAccepted: 0,
  friendPushes: 0,
  activityPushes: 0,
  httpRequests: 0,
  httpErrors: 0,
});

// What was counted between two reads of the counters.
export const countersSince = (before: Counters, now: Counters) => {
  const delta = createCounters();

  for (const name of COUNTER_NAMES) {
    delta[name] = now[name] - before[name];
  }

  return delta;
};

const CLOCK_TICKS_PER_SECOND = 100;

const cpuTicksOf = (pid: number) => {
  const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
  // Past the command name, which may hold spaces: utime and stime are fields 14 and 15.
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");

  return Number(fields[11]) + Number(fields[12]);
};

const rssMbOf = (pid: number) => {
  const match = /VmRSS:\s+(\d+) kB/.exec(readFileSync(`/proc/${pid}/status`, "utf8"));

  return match ? Number(match[1]) / 1024 : 0;
};

// The API process seen from /proc: its CPU share of one core since the last sample, and its RSS.
export const createProcessSampler = (pid: number) => {
  let lastTicks = cpuTicksOf(pid);
  let lastAt = performance.now();

  return () => {
    const ticks = cpuTicksOf(pid);
    const now = performance.now();
    const cpu = ((ticks - lastTicks) / CLOCK_TICKS_PER_SECOND / ((now - lastAt) / 1000)) * 100;

    lastTicks = ticks;
    lastAt = now;

    return { cpu, rssMb: rssMbOf(pid) };
  };
};
