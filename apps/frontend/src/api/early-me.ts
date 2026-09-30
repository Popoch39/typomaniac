// The `me` request index.html sends as the page opens, before the app's JS downloads: its URL, and
// its answer (null when it failed).
type EarlyRequest = { url: string; response: Promise<Response | null> };

declare global {
  interface Window {
    typomaniacEarlyMe?: EarlyRequest;
  }
}

// Eden's fetcher: the first request for that URL takes the answer already on its way, once; every
// other request, or a failed early one, goes through fetch as usual (looked up at each call, as
// the tests stub it).
export const fetchWithEarlyMe = (input: RequestInfo | URL, init?: RequestInit) => {
  const early = window.typomaniacEarlyMe;
  const method = init?.method ?? "GET";

  if (early === undefined || method !== "GET" || String(input) !== early.url) {
    return fetch(input, init);
  }

  window.typomaniacEarlyMe = undefined;

  return early.response.then((response) => response ?? fetch(input, init));
};
