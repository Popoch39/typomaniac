import type { KeyboardEvent, Ref } from "react";
import type { Key } from "typing-engine";

import { useClock } from "@/components/run/clock-context";
import { toKey } from "@/components/run/typed-key";

type KeystrokeInputProps = {
  ref: Ref<HTMLInputElement>;
  onFocusChange: (focused: boolean) => void;
  // Called with each Key and the clock's reading when it was pressed.
  onPress: (key: Key, now: number) => void;
};

// Hidden input that captures the keyboard and stamps each Keystroke with the injected clock.
export const KeystrokeInput = ({ ref, onFocusChange, onPress }: KeystrokeInputProps) => {
  const clock = useClock();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const key = toKey(event);

    if (key === null) {
      return;
    }

    event.preventDefault();
    onPress(key, clock());
  };

  return (
    <input
      ref={ref}
      aria-label="Zone de frappe"
      className="sr-only"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      onKeyDown={handleKeyDown}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
    />
  );
};
