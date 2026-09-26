// Ramps connected Users against a running API until a threshold holds for --sustain-ms: the last
// step below it is the capacity. See README.md for the setup.
import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { type BotContext, startBot } from "./bot";
import {
  type Counters,
  countersSince,
  createCounters,
  createHistogram,
  createProcessSampler,
} from "./metrics";

const { values } = parseArgs({
  options: {
    "api-url": { type: "string", default: "http://localhost:3000" },
    "server-pid": { type: "string" },
    // How many Users the seed wrote: Friends wrap around at that count.
    users: { type: "string", default: "1000" },
    "max-users": { type: "string" },
    step: { type: "string", default: "250" },
    "step-ms": { type: "string", default: "60000" },
    "sample-ms": { type: "string", default: "5000" },
    "sustain-ms": { type: "string", default: "30000" },
    "p95-ms": { type: "string", default: "100" },
    "cpu-percent": { type: "string", default: "85" },
    "rss-mb": { type: "string", default: "1024" },
    "error-rate": { type: "string", default: "0.001" },
  },
});

const secret = process.env.BETTER_AUTH_SECRET;

const serverPid = Number(values["server-pid"]);

if (!secret || !Number.isInteger(serverPid)) {
  console.error("BETTER_AUTH_SECRET (the API's) and --server-pid are required");
  process.exit(1);
}

const users = Number(values.users);

const maxUsers = Math.min(users, Number(values["max-users"] ?? users));

const step = Number(values.step);

const stepMs = Number(values["step-ms"]);

const sampleMs = Number(values["sample-ms"]);

const sustainMs = Number(values["sustain-ms"]);

const thresholds = {
  p95Ms: Number(values["p95-ms"]),
  cpuPercent: Number(values["cpu-percent"]),
  rssMb: Number(values["rss-mb"]),
  errorRate: Number(values["error-rate"]),
};

// A step's connections open over this long, not all in the same tick.
const STAGGER_MS = 10_000;

// A batch unanswered for this long is lost: its latency is never recorded.
const IN_FLIGHT_TTL_MS = 10_000;

let stopping = false;

const context: BotContext = {
  apiUrl: values["api-url"],
  secret,
  users,
  counters: createCounters(),
  keystrokeLatency: createHistogram(),
  activityLatency: createHistogram(),
  inFlight: new Map(),
  stopping: () => stopping,
};

const sampleProcess = createProcessSampler(serverPid);

const closers: (() => void)[] = [];

let target = 0;

const openStep = () => {
  const from = target;

  target = Math.min(maxUsers, target + step);

  for (let index = from; index < target; index++) {
    setTimeout(
      () => {
        startBot(index, context)
          .then((close) => closers.push(close))
          .catch(() => {
            context.counters.connectFailures += 1;
          });
      },
      ((index - from) / step) * STAGGER_MS,
    );
  }
};

type Sample = {
  at: string;
  target: number;
  connected: number;
  inDuel: number;
  cpu: number;
  rssMb: number;
  keystrokes: ReturnType<BotContext["keystrokeLatency"]["drain"]>;
  activity: ReturnType<BotContext["activityLatency"]["drain"]>;
  errorRate: number;
  counters: Counters;
};

const samples: Sample[] = [];

let previous = { ...context.counters };

const breachedSince = new Map<string, number>();

const errorsOf = (c: Counters) =>
  c.connectFailures + c.unexpectedCloses + c.invalidMessages + c.httpErrors;

const operationsOf = (c: Counters) => c.sent + c.httpRequests + c.connected + c.connectFailures;

const breachesOf = (sample: Sample) => {
  const breaches: string[] = [];

  if ((sample.keystrokes.p95 ?? 0) > thresholds.p95Ms) {
    breaches.push(`p95 keystroke latency > ${thresholds.p95Ms} ms`);
  }

  if (sample.cpu > thresholds.cpuPercent) {
    breaches.push(`CPU > ${thresholds.cpuPercent} %`);
  }

  if (sample.rssMb > thresholds.rssMb) {
    breaches.push(`RSS > ${thresholds.rssMb} MB`);
  }

  if (sample.errorRate > thresholds.errorRate) {
    breaches.push(`error rate > ${thresholds.errorRate * 100} %`);
  }

  return breaches;
};

const format = (value: number | null, digits = 0) => (value === null ? "-" : value.toFixed(digits));

console.log("target  conn  inDuel cpu%   rssMB  ks p50/p95/p99 ms   act p95 ms  msg/s in  err%");

const startedAt = Date.now();

const results = `${import.meta.dir.replace(/\/src$/, "")}/results`;

const finish = (verdict: string) => {
  stopping = true;
  clearInterval(sampler);
  clearInterval(ramp);

  for (const close of closers) {
    close();
  }

  const lastHealthy = samples.findLast((sample) => breachesOf(sample).length === 0);

  const report = {
    startedAt: new Date(startedAt).toISOString(),
    thresholds,
    verdict,
    capacity: lastHealthy ? { connected: lastHealthy.connected, inDuel: lastHealthy.inDuel } : null,
    samples,
  };

  mkdirSync(results, { recursive: true });

  const file = `${results}/${new Date(startedAt).toISOString().replaceAll(":", "-")}.json`;

  writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(`\n${verdict}`);
  console.log(
    `Capacity: ${report.capacity ? `${report.capacity.connected} connected, ${report.capacity.inDuel} in a Duel` : "none"}`,
  );
  console.log(`Report: ${file}`);
  setTimeout(() => process.exit(0), 1000);
};

const sampler = setInterval(() => {
  const now = performance.now();

  for (const [key, sentAt] of context.inFlight) {
    if (now - sentAt > IN_FLIGHT_TTL_MS) {
      context.inFlight.delete(key);
    }
  }

  const current = { ...context.counters };
  const delta = countersSince(previous, current);

  previous = current;

  const operations = operationsOf(delta);

  const sample: Sample = {
    at: new Date().toISOString(),
    target,
    connected: current.connected,
    // Players, not Duels: each bot counts its own side.
    inDuel: current.duelsStarted - current.duelsEnded,
    ...sampleProcess(),
    keystrokes: context.keystrokeLatency.drain(),
    activity: context.activityLatency.drain(),
    errorRate: operations === 0 ? 0 : errorsOf(delta) / operations,
    counters: delta,
  };

  samples.push(sample);

  const ks = sample.keystrokes;

  console.log(
    [
      String(sample.target).padStart(6),
      String(sample.connected).padStart(5),
      String(sample.inDuel).padStart(6),
      format(sample.cpu, 1).padStart(5),
      format(sample.rssMb).padStart(7),
      `${format(ks.p50)}/${format(ks.p95)}/${format(ks.p99)}`.padStart(19),
      format(sample.activity.p95).padStart(11),
      format(delta.received / (sampleMs / 1000)).padStart(9),
      format(sample.errorRate * 100, 2).padStart(5),
    ].join(" "),
  );

  const breaches = breachesOf(sample);

  for (const name of breachedSince.keys()) {
    if (!breaches.includes(name)) {
      breachedSince.delete(name);
    }
  }

  for (const name of breaches) {
    const since = breachedSince.get(name) ?? now;

    breachedSince.set(name, since);

    if (now - since >= sustainMs) {
      finish(`Stopped: ${name} for ${sustainMs / 1000} s at ${sample.connected} connected`);

      return;
    }
  }
}, sampleMs);

const ramp = setInterval(() => {
  if (target >= maxUsers) {
    finish(`Reached --max-users ${maxUsers} without a sustained breach`);

    return;
  }

  openStep();
}, stepMs);

openStep();

process.on("SIGINT", () => finish("Interrupted"));
