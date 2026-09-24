export const HANDLE_MIN_LENGTH = 3;

export const HANDLE_MAX_LENGTH = 20;

const HANDLE_CHARS = /^[a-z0-9_]*$/;

// The search looks for Users from this many characters of their Handle.
export const HANDLE_SEARCH_MIN_LENGTH = 2;

// Whether some Handle may start with `prefix`, already lowercased: the search skips the others.
export const isHandlePrefix = (prefix: string) =>
  HANDLE_CHARS.test(prefix) && prefix.length <= HANDLE_MAX_LENGTH;

// Names that would pass for the team or for a page of the app.
const RESERVED_HANDLES = new Set([
  "admin",
  "administrator",
  "anonymous",
  "api",
  "friends",
  "help",
  "moderator",
  "null",
  "official",
  "profile",
  "root",
  "settings",
  "staff",
  "support",
  "system",
  "team",
  "typomaniac",
  "undefined",
]);

// Why a Handle is refused on its own. The API adds `taken`, which only the database knows: every
// schema and message of the reasons derives from this list.
export const HANDLE_REFUSALS = ["too-short", "too-long", "invalid-chars", "reserved"] as const;

export type HandleRefusal = (typeof HANDLE_REFUSALS)[number];

export type ParsedHandle = { ok: true; handle: string } | { ok: false; reason: HandleRefusal };

// A Handle as typed, lowercased: the same rules for the live check of the front and the API. The
// characters first: "é" is a forbidden character before it is a short Handle.
export const parseHandle = (input: string): ParsedHandle => {
  const handle = input.toLowerCase();

  if (!HANDLE_CHARS.test(handle)) {
    return { ok: false, reason: "invalid-chars" };
  }

  if (handle.length < HANDLE_MIN_LENGTH) {
    return { ok: false, reason: "too-short" };
  }

  if (handle.length > HANDLE_MAX_LENGTH) {
    return { ok: false, reason: "too-long" };
  }

  if (RESERVED_HANDLES.has(handle)) {
    return { ok: false, reason: "reserved" };
  }

  return { ok: true, handle };
};

// A name with nothing left once cleaned (another alphabet, emoji only).
const FALLBACK_HANDLE = "typist";

// A Handle to start from, drawn from the name of the User's provider: its words joined by
// underscores, without accents, cut to the maximum length. Always valid; it may be taken.
export const suggestHandle = (name: string) => {
  const words = name
    .normalize("NFD")
    .toLowerCase()
    .replaceAll(/\p{Diacritic}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);

  const handle = words.join("_").slice(0, HANDLE_MAX_LENGTH).replace(/_+$/, "");

  if (handle.length === 0) {
    return FALLBACK_HANDLE;
  }

  const padded = handle.padEnd(HANDLE_MIN_LENGTH, "_");

  return RESERVED_HANDLES.has(padded) ? `${padded}_` : padded;
};
