import { afterEach, expect, test, vi } from "vitest";

import { useAuthStore } from "@/stores/auth-store";

afterEach(() => {
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
  useAuthStore.setState(useAuthStore.getInitialState());
});

test("the OAuth round trip comes back to the same page, in the current Locale", async () => {
  const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    Response.json({ url: "https://github.com/login/oauth", redirect: false }),
  );

  vi.stubGlobal("fetch", fetch);
  history.replaceState(null, "", "/en/u/ada?tab=stats");

  await useAuthStore.getState().startSignIn("github");

  const body = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));

  expect(new URL(body.callbackURL).pathname).toBe("/en/u/ada");
  expect(new URL(body.errorCallbackURL).pathname).toBe("/en/u/ada");
});
