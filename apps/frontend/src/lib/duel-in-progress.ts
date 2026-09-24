const KEY = "typomaniac-duel-in-progress";

// For this tab only, and only while a Duel is played: a reload reopens Duel to resume it, a new
// visit still starts in Solo. Storage can be unavailable (see safe-storage, whose async-capable
// StateStorage does not fit a synchronous read at startup): the Duel is then only resumed by the
// server if Duel is picked again.
export const hasDuelInProgress = () => {
  try {
    return window.sessionStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
};

export const markDuelInProgress = (inProgress: boolean) => {
  try {
    if (inProgress) {
      window.sessionStorage.setItem(KEY, "1");
    } else {
      window.sessionStorage.removeItem(KEY);
    }
  } catch {
    // Nothing to resume after a reload, then.
  }
};
