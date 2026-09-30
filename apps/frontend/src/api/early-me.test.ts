import { afterEach, expect, test, vi } from "vitest";

import { fetchWithEarlyMe } from "@/api/early-me";

const meUrl = "http://api.test/api/me";

afterEach(() => {
  vi.unstubAllGlobals();
  window.typomaniacEarlyMe = undefined;
});

test("the first `me` takes the early answer, the next one asks again", async () => {
  const fetch = vi.fn(async () => Response.json({ name: "later" }));

  vi.stubGlobal("fetch", fetch);
  window.typomaniacEarlyMe = {
    url: meUrl,
    response: Promise.resolve(Response.json({ name: "early" })),
  };

  expect(await (await fetchWithEarlyMe(meUrl, { method: "GET" })).json()).toEqual({
    name: "early",
  });
  expect(fetch).not.toHaveBeenCalled();

  expect(await (await fetchWithEarlyMe(meUrl, { method: "GET" })).json()).toEqual({
    name: "later",
  });
  expect(fetch).toHaveBeenCalledOnce();
});

test("another request goes through fetch and leaves the early answer waiting", async () => {
  const fetch = vi.fn(async () => Response.json({ ok: true }));

  vi.stubGlobal("fetch", fetch);
  window.typomaniacEarlyMe = { url: meUrl, response: Promise.resolve(Response.json({})) };

  await fetchWithEarlyMe("http://api.test/api/pace", { method: "GET" });
  await fetchWithEarlyMe(meUrl, { method: "POST" });

  expect(fetch).toHaveBeenCalledTimes(2);
  expect(window.typomaniacEarlyMe).toBeDefined();
});

test("a failed early request asks again", async () => {
  const fetch = vi.fn(async () => Response.json({ name: "retried" }));

  vi.stubGlobal("fetch", fetch);
  window.typomaniacEarlyMe = { url: meUrl, response: Promise.resolve(null) };

  expect(await (await fetchWithEarlyMe(meUrl, { method: "GET" })).json()).toEqual({
    name: "retried",
  });
  expect(fetch).toHaveBeenCalledOnce();
});
