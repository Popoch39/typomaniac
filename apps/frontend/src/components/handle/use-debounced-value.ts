import { useEffect, useState } from "react";

// The value once it has stopped changing for `ms`: a request per pause, not per key.
export const useDebouncedValue = <T>(value: T, ms: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);

    return () => clearTimeout(timer);
  }, [value, ms]);

  return debounced;
};
