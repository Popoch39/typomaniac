import { HANDLE_REFUSALS, parseHandle } from "handle";

import { ApiError } from "../errors";
import type { Users } from "../users";

// Why the API refuses a Handle: the rules of the shared module, or held by another User.
export const HANDLE_UNAVAILABLE = [...HANDLE_REFUSALS, "taken"] as const;

export type HandleUnavailable = (typeof HANDLE_UNAVAILABLE)[number];

export type HandleCheck =
  | { available: true; handle: string }
  | { available: false; reason: HandleUnavailable };

const heldByAnother = async (users: Users, userId: string, handle: string) => {
  const holder = await users.idOfHandle(handle);

  return holder !== null && holder !== userId;
};

// Whether `userId` may take this Handle: valid, and free or already theirs.
export const checkHandle = async (
  users: Users,
  userId: string,
  input: string,
): Promise<HandleCheck> => {
  const parsed = parseHandle(input);

  if (!parsed.ok) {
    return { available: false, reason: parsed.reason };
  }

  if (await heldByAnother(users, userId, parsed.handle)) {
    return { available: false, reason: "taken" };
  }

  return { available: true, handle: parsed.handle };
};

// The refusal as an API error, the reason in its details: the front tells the User what to fix.
const refused = (reason: HandleUnavailable) => {
  const details = [{ path: "/handle", message: reason }];

  return reason === "taken"
    ? new ApiError("CONFLICT", "This Handle is taken", details)
    : new ApiError("VALIDATION_FAILED", "This Handle is not valid", details);
};

// Gives `userId` this Handle, which frees their previous one. Another User may take it between the
// check and the write: the database refuses it then, answered as taken, not as a failure.
export const setHandle = async (users: Users, userId: string, input: string) => {
  const check = await checkHandle(users, userId, input);

  if (!check.available) {
    throw refused(check.reason);
  }

  try {
    await users.setHandle(userId, check.handle);
  } catch (error) {
    if (await heldByAnother(users, userId, check.handle)) {
      throw refused("taken");
    }

    throw error;
  }

  return check.handle;
};
