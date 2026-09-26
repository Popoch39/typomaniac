// The load test's Users, derived from their index: the seed writes them, the run reads them back
// by the same functions.

const pad = (index: number) => String(index).padStart(6, "0");

export const userIdOf = (index: number) => `lt-${pad(index)}`;

// Within the Handle rules: lowercase letters, digits and underscores, 20 characters at most.
export const handleOf = (index: number) => `lt_${pad(index)}`;

export const sessionTokenOf = (index: number) => `lt-session-${pad(index)}`;

// Each User's Friends: the FRIENDS_EACH_WAY next and previous indexes, wrapping around.
export const FRIENDS_EACH_WAY = 10;

export const friendIndexesOf = (index: number, users: number) => {
  const friends: number[] = [];

  for (let offset = 1; offset <= FRIENDS_EACH_WAY; offset++) {
    friends.push((index + offset) % users, (index - offset + users) % users);
  }

  return friends;
};

// Duelists play Duels in a loop, the others stay idle: DUELIST_SHARE of each five Users.
export const isDuelist = (index: number) => index % 5 < 2;

// Better Auth's signed cookie (better-call's signCookieValue): `<token>.<base64 HMAC-SHA256>`.
export const sessionCookieOf = async (index: number, secret: string) => {
  const token = sessionTokenOf(index);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  const value = `${token}.${Buffer.from(signature).toString("base64")}`;

  return `better-auth.session_token=${encodeURIComponent(value)}`;
};
