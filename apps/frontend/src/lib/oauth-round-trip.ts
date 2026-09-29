const KEY = "typomaniac-oauth-round-trip";

// For this tab only, from the redirect to the OAuth provider until the page it sends the User back
// to starts: that page knows it is a return, and plays no Intro. Storage can be unavailable (see
// safe-storage, whose async-capable StateStorage does not fit a synchronous read at startup): the
// return then plays the Intro again.
export const markOAuthRoundTrip = (leaving: boolean) => {
  try {
    if (leaving) {
      window.sessionStorage.setItem(KEY, "1");
    } else {
      window.sessionStorage.removeItem(KEY);
    }
  } catch {
    // The return looks like a first load, then.
  }
};

// Whether this page is the return of an OAuth round trip, read once as it starts: the flag is
// removed, so a reload afterwards is a load like any other.
export const consumeOAuthReturn = () => {
  try {
    const returning = window.sessionStorage.getItem(KEY) !== null;

    window.sessionStorage.removeItem(KEY);

    return returning;
  } catch {
    return false;
  }
};
