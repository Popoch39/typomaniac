import { useQuery } from "@tanstack/react-query";
import { parseHandle } from "handle";

import { handleAvailabilityQueryOptions, type HandleUnavailable } from "@/api/handle";
import { useDebouncedValue } from "@/components/handle/use-debounced-value";

// Waits this long after the last key before asking the API.
const CHECK_DELAY_MS = 300;

export type HandleStatus =
  | { kind: "refused"; reason: HandleUnavailable }
  // The User's own Handle, unchanged.
  | { kind: "current" }
  | { kind: "checking" }
  | { kind: "available"; handle: string }
  // The API could not tell: the save will.
  | { kind: "unknown" };

// The live check of a Handle as typed: the shared rules at once, then whether it is free, once the
// User pauses.
export const useHandleCheck = (input: string, current: string | null): HandleStatus => {
  const parsed = parseHandle(input);
  const debounced = parseHandle(useDebouncedValue(input, CHECK_DELAY_MS));
  const toCheck = debounced.ok && debounced.handle !== current ? debounced.handle : null;

  const availability = useQuery({
    ...handleAvailabilityQueryOptions(toCheck ?? ""),
    enabled: toCheck !== null,
  });

  if (!parsed.ok) {
    return { kind: "refused", reason: parsed.reason };
  }

  if (parsed.handle === current) {
    return { kind: "current" };
  }

  if (!debounced.ok || debounced.handle !== parsed.handle || availability.isPending) {
    return { kind: "checking" };
  }

  if (availability.isError) {
    return { kind: "unknown" };
  }

  return availability.data.available
    ? { kind: "available", handle: availability.data.handle }
    : { kind: "refused", reason: availability.data.reason };
};
