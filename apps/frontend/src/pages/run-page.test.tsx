import { act, screen, waitFor } from "@testing-library/react";
import type { RunConfig } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useConnectionStore } from "@/stores/connection-store";
import { useRunStore } from "@/stores/run-store";
import { useSettingsStore } from "@/stores/settings-store";
import { fakeServer } from "@/test/fake-socket";
import { ada, renderAppFor } from "@/test/render-app";

// The Best Run on /run: each Run a User finishes is sent to the API, once.

// Seed 42 in English, version 1, gives this Text (pinned in the typing-engine tests).
const TEXT = "small help while late letter sell driver quiet never learn";

const WORDS_10: RunConfig = {
  mode: "words",
  words: 10,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

let sockets = fakeServer();

// The API as the test stubs it: `answer` for each Run sent, the other calls left unanswered.
const stubApi = (answer: () => Promise<Response>) => {
  const fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) =>
    String(input).endsWith("/api/runs") ? answer() : new Promise<Response>(() => {}),
  );

  vi.stubGlobal("fetch", fetch);

  // The bodies of the Runs sent so far.
  return () =>
    fetch.mock.calls.flatMap(([input, init]) =>
      String(input).endsWith("/api/runs") && init?.method === "POST"
        ? [JSON.parse(String(init.body))]
        : [],
    );
};

const bestRunAnswer = async () =>
  new Response(JSON.stringify({ seed: 42, wordListVersion: 1, keystrokes: [], wpm: 90 }), {
    headers: { "content-type": "application/json" },
  });

// Opens /run on Seed 42's Text and types it all, which finishes the Run.
const finishRun = async (reader: typeof ada | null) => {
  const { user } = await renderAppFor("/fr/run", { reader, openSocket: sockets.open });

  act(() => useRunStore.getState().start(WORDS_10));
  await user.keyboard(TEXT);
};

// The finished Run's screen: its Result, then what to play next.
const resultShown = () => screen.findByRole("button", { name: /Suivant/ });

beforeEach(() => {
  localStorage.clear();
  sockets = fakeServer();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useConnectionStore.getState().close();
});

describe("a finished Run", () => {
  test("of a User is sent once, with its setting, its Text and its Keystrokes", async () => {
    const sentRuns = stubApi(bestRunAnswer);

    await finishRun(ada);
    await resultShown();

    await waitFor(() => {
      expect(sentRuns()).toHaveLength(1);
    });
    expect(sentRuns()[0]).toEqual({
      mode: "words",
      length: 10,
      language: "en",
      seed: 42,
      wordListVersion: 1,
      keystrokes: [...TEXT].map((char) => ({ kind: "char", char, at: 0 })),
    });
  });

  test("of a Visitor is never sent", async () => {
    const sentRuns = stubApi(bestRunAnswer);

    await finishRun(null);
    await resultShown();

    expect(sentRuns()).toEqual([]);
  });

  test("shows its Result even when it cannot be sent, without a word about it", async () => {
    const sentRuns = stubApi(async () => {
      throw new TypeError("Failed to fetch");
    });

    await finishRun(ada);

    expect(await resultShown()).toBeVisible();
    await waitFor(() => {
      expect(sentRuns()).toHaveLength(1);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
