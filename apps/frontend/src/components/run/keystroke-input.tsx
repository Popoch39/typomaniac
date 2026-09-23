import type { KeyboardEvent } from "react";

import { useClock } from "@/components/run/clock-context";
import { useRunStore } from "@/stores/run-store";

// Grabs the focus as soon as it is mounted, so the Run starts on the first key.
const focusOnMount = (input: HTMLInputElement | null) => input?.focus();

// Hidden input that captures the keyboard and stamps each Keystroke with the injected clock.
export const KeystrokeInput = () => {
  const clock = useClock();
  const type = useRunStore((state) => state.type);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // `key` is a single character for printable keys only, shortcuts are left to the browser.
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    event.preventDefault();
    type(event.key, clock());
  };

  return (
    <input
      ref={focusOnMount}
      aria-label="Zone de frappe"
      className="sr-only"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      onKeyDown={handleKeyDown}
    />
  );
};
