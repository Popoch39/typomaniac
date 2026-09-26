import { TypeCompiler } from "@sinclair/typebox/compiler";
import { type ClientMessage, type Duel, DuelModel } from "api/protocol";
import { generateText, type Keystroke } from "typing-engine";

import type { Counters, Histogram } from "./metrics";
import { friendIndexesOf, handleOf, isDuelist, sessionCookieOf, userIdOf } from "./users";

const serverMessage = TypeCompiler.Compile(DuelModel.serverMessage);

// The front's batching: what was typed in the last 50 ms goes in one message.
const BATCH_MS = 50;

// About 60 wpm: 5 characters a second.
const CHARS_PER_SECOND = 5;

const WORDS = 100;

// A player takes a moment between two Duels, an idle User between two page loads.
const THINK_MS = { min: 1000, max: 3000 };

const HTTP_EVERY_MS = 30_000;

// Rare enough that the idle Users stay mostly idle: the mix stays close to 40 % in a Duel.
const CHALLENGE_EVERY_MS = 300_000;

const between = (min: number, max: number) => min + Math.random() * (max - min);

// Shared by every bot of the run: what they measure and what they count.
export type BotContext = {
  apiUrl: string;
  secret: string;
  users: number;
  counters: Counters;
  // From a batch sent to the matching `opponent-keystrokes` received by the opponent's bot.
  keystrokeLatency: Histogram;
  // From the end of a Duel (the Activity's `at`) to `activity-added` at the players' Friends.
  activityLatency: Histogram;
  // Batches on their way, keyed by batchKey: when they were sent (performance.now()).
  inFlight: Map<string, number>;
  stopping: () => boolean;
};

// Both players' bots run in this process: the receiver finds the sender's batch by this key.
const batchKey = (duelId: string, keystrokes: readonly Keystroke[]) =>
  `${duelId}:${keystrokes[0]?.at ?? -1}:${keystrokes.length}`;

// One User with one tab open: a duelist queues again after each Duel, an idle User reads pages
// and now and then challenges a Friend. Both accept the Challenges they receive.
export const startBot = async (index: number, context: BotContext) => {
  const { counters } = context;
  const duelist = isDuelist(index);
  const cookie = await sessionCookieOf(index, context.secret);
  const wsUrl = `${context.apiUrl.replace(/^http/, "ws")}/api/duel`;
  const socket = new WebSocket(wsUrl, { headers: { cookie } });
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let typing: ReturnType<typeof setInterval> | null = null;
  let opened = false;

  const later = (ms: number, run: () => void) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      run();
    }, ms);

    timers.add(timer);
  };

  const send = (message: ClientMessage) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      counters.sent += 1;
    }
  };

  const queueSoon = () => {
    if (duelist) {
      later(between(THINK_MS.min, THINK_MS.max), () => send({ type: "join-queue" }));
    }
  };

  const stopTyping = () => {
    if (typing !== null) {
      clearInterval(typing);
      typing = null;
    }
  };

  const play = (duel: Duel) => {
    counters.duelsStarted += 1;
    stopTyping();

    const text = generateText(duel.seed, duel.language, duel.wordListVersion, WORDS).join(" ");
    const endsAt = duel.startsAt + duel.seconds * 1000;
    let typed = 0;
    let owed = 0;

    later(Math.max(0, duel.startsAt - Date.now()), () => {
      typing = setInterval(() => {
        const now = Date.now();

        if (now >= endsAt) {
          stopTyping();

          return;
        }

        owed += (CHARS_PER_SECOND * BATCH_MS) / 1000;

        const keystrokes: Keystroke[] = [];

        // Stamped a little in the past: the server refuses a Keystroke from its future.
        const at = Math.max(0, now - duel.startsAt - 1);

        for (; owed >= 1 && typed < text.length; owed -= 1, typed += 1) {
          keystrokes.push({ kind: "char", char: text[typed] ?? " ", at });
        }

        if (keystrokes.length > 0) {
          context.inFlight.set(batchKey(duel.id, keystrokes), performance.now());
          send({ type: "keystrokes", keystrokes });
        }
      }, BATCH_MS);
    });

    return duel.id;
  };

  let duelId: string | null = null;

  socket.addEventListener("message", (event) => {
    counters.received += 1;

    const message = JSON.parse(String(event.data));

    if (!serverMessage.Check(message)) {
      counters.invalidMessages += 1;

      return;
    }

    switch (message.type) {
      case "idle":
        queueSoon();
        break;
      case "duel-found":
        duelId = play(message.duel);
        break;
      case "opponent-keystrokes": {
        const key = batchKey(duelId ?? "", message.keystrokes);
        const sentAt = context.inFlight.get(key);

        if (typeof sentAt !== "undefined") {
          context.inFlight.delete(key);
          context.keystrokeLatency.record(performance.now() - sentAt);
        }

        break;
      }

      case "resync":
        counters.resyncs += 1;
        break;
      case "duel-ended":
        stopTyping();
        duelId = null;
        counters.duelsEnded += 1;
        counters.duelsUnwritten += message.duelId === null ? 1 : 0;
        counters.forfeits += message.forfeit ? 1 : 0;
        queueSoon();
        break;
      case "challenge-received":
        if (duelId === null) {
          counters.challengesAccepted += 1;
          send({ type: "accept-challenge", challengeId: message.challenge.id });
        }

        break;
      case "activity-added":
        counters.activityPushes += 1;
        context.activityLatency.record(Date.now() - message.activity.at);
        break;
      case "presence":
      case "friend-arrived":
      case "friends-snapshot":
        counters.friendPushes += 1;
        break;
      case "handle-required":
      case "invalid-message":
        counters.invalidMessages += 1;
        break;
      default:
        break;
    }
  });

  // An idle User loads a page now and then: the leaderboard, or a Friend's profile.
  const browse = () => {
    const path =
      Math.random() < 0.5
        ? "/api/leaderboard"
        : `/api/users/${handleOf(friendIndexesOf(index, context.users)[0] ?? 0)}/profile`;

    counters.httpRequests += 1;

    fetch(`${context.apiUrl}${path}`, { headers: { cookie } })
      .then(async (response) => {
        await response.arrayBuffer();

        if (!response.ok) {
          counters.httpErrors += 1;
        }
      })
      .catch(() => {
        counters.httpErrors += 1;
      })
      .finally(() => later(between(HTTP_EVERY_MS / 2, HTTP_EVERY_MS * 1.5), browse));
  };

  // Idle Users whose next Friend is idle too challenge them now and then: never a duelist, who is
  // mostly in the Queue or a Duel.
  const nextFriend = (index + 1) % context.users;
  const challenges = !duelist && !isDuelist(nextFriend) && index % 5 === 2;

  const challenge = () => {
    if (duelId === null) {
      counters.challengesSent += 1;
      send({ type: "send-challenge", userId: userIdOf(nextFriend) });
    }

    later(between(CHALLENGE_EVERY_MS / 2, CHALLENGE_EVERY_MS * 1.5), challenge);
  };

  socket.addEventListener("open", () => {
    opened = true;
    counters.connected += 1;

    if (!duelist) {
      later(between(0, HTTP_EVERY_MS), browse);
    }

    if (challenges) {
      later(between(0, CHALLENGE_EVERY_MS), challenge);
    }
  });

  socket.addEventListener("close", () => {
    stopTyping();

    for (const timer of timers) {
      clearTimeout(timer);
    }

    if (!opened) {
      counters.connectFailures += 1;
    } else if (!context.stopping()) {
      counters.connected -= 1;
      counters.unexpectedCloses += 1;
    }
  });

  return () => socket.close(1000);
};
