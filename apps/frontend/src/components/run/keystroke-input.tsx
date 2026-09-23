import type { KeyboardEvent, Ref } from "react";

import { useClock } from "@/components/run/clock-context";
import { toKey } from "@/components/run/typed-key";
import { useRunStore } from "@/stores/run-store";

type KeystrokeInputProps = {
  ref: Ref<HTMLInputElement>;
  onFocusChange: (focused: boolean) => void;
};

// Hidden input that captures the keyboard and stamps each Keystroke with the injected clock.
export const KeystrokeInput = ({ ref, onFocusChange }: KeystrokeInputProps) => {
  const clock = useClock();
  const press = useRunStore((state) => state.press);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const key = toKey(event);

    if (key === null) {
      return;
    }

    event.preventDefault();
    press(key, clock());
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
