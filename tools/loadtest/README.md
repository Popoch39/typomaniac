# loadtest

Load test for the API's real-time side: how many Users one API process can hold before a threshold
breaks. This tells you when to move to Redis pub/sub. The Duel socket's state lives in the process
(ADR 0007), so a single instance is the ceiling.

## Scenario

- The bots ramp up in steps (`--step` Users every `--step-ms`). Each step's connections open over
  10 s.
- 40 % of the Users are **duelists**: Queue → Duel of 30 s at about 60 wpm, in 50 ms batches like
  the front → back to the Queue.
- 60 % are **idle**: the socket stays open and they load a page every ~30 s (leaderboard, a
  Friend's profile). Some of them challenge an idle Friend every ~5 min, and the Friend accepts.
- Each User has 20 Friends, so Presence and the Activity fan out on every connection and every end
  of Duel.
- Everything runs on Postgres for real: Duels, Ratings and TP are written.

## Measures and thresholds

The run stops when a threshold holds for `--sustain-ms` (30 s by default). The capacity is the
last sample below every threshold.

| Measure                                                                                | Default flag         |
| -------------------------------------------------------------------------------------- | -------------------- |
| p95 latency from a batch sent to `opponent-keystrokes` received (same clock, no drift) | `--p95-ms 100`       |
| API CPU, share of one core (`/proc/<pid>/stat`)                                        | `--cpu-percent 85`   |
| API RSS                                                                                | `--rss-mb 1024`      |
| Errors / operations (failed connections, drops, invalid messages, HTTP errors)         | `--error-rate 0.001` |

`act p95` measures the time from the end of a Duel to `activity-added` at the Friends. It includes
the end tolerance (`END_TOLERANCE_MS`, 1 s), so ~1000 ms is the idle baseline.

Every sample prints a line, and the full report goes to `results/<date>.json`, which is ignored by
git.

## Running it

```sh
# 1. A dedicated database, never the dev one: the seed writes thousands of Users
docker compose up -d
docker exec typomaniac-db-1 psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "create database typomaniac_loadtest"
export DATABASE_URL=postgres://<user>:<password>@localhost:5434/typomaniac_loadtest

# 2. The API on ONE core (like a small VM), no rate limit, on a port of its own
cd apps/api
BETTER_AUTH_SECRET=loadtest-secret-of-at-least-thirty-two-chars BETTER_AUTH_URL=http://localhost:3100 \
  PORT=3100 RATE_LIMIT_MAX=100000000 LOG_LEVEL=warn taskset -c 0 bun run src/index.ts

# 3. The Users (idempotent, run it again to add more)
cd tools/loadtest
bun run seed --users 10000

# 4. The ramp, on the other cores
ulimit -n 100000
BETTER_AUTH_SECRET=loadtest-secret-of-at-least-thirty-two-chars taskset -c 1-7 bun run src/run.ts \
  --api-url http://localhost:3100 \
  --server-pid "$(ss -ltnp | rg ':3100 ' | rg -o 'pid=\d+' | cut -d= -f2)" \
  --users 10000 --step 1000 --step-ms 30000
```

`BETTER_AUTH_SECRET` must be the API's own: the seed writes the Sessions, and the run signs their
cookies with this secret.

## Limits

- The generator shares the machine with the API: `taskset` separates their cores, but not the
  memory or the network (loopback, so no real latency).
- A ramp step of 30 s is shorter than one Duel cycle. Once the ramp reaches the ceiling, let a run
  hold that level (`--max-users`) to confirm it.
