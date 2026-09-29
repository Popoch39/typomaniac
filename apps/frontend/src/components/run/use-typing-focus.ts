import { useEffect, useRef, useState } from "react";

import { isTypedKey } from "@/components/run/typed-key";
import { useIntroStore } from "@/stores/intro-store";

// Fields, menus (typeahead) and dialogs use the letters typed in them.
const keyOwners = "input, textarea, select, [contenteditable], [role=menu], [role=dialog]";

const keepsItsKeys = (target: EventTarget | null) =>
  target instanceof Element && target.closest(keyOwners) !== null;

// Whether the hidden input holds the focus, and how to give it back. Nothing pauses while it is
// lost: the clock keeps running, so a Run cannot be paused to cheat in a Duel. While the Intro
// plays, the input waits: no focus, no key to give it, no veil over the Text; the focus comes
// with its end.
export const useTypingFocus = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const introPlaying = useIntroStore((store) => store.playing);

  const focus = () => inputRef.current?.focus();

  useEffect(() => {
    if (introPlaying) {
      return;
    }

    const input = inputRef.current;

    // Grab the focus on mount (or once the Intro is over), so the Run starts on the first key.
    input?.focus();

    // A key typed elsewhere on the page gives the focus back; the key itself is not typed.
    // Space is left alone: it presses the focused button.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypedKey(event) && event.key !== " " && !keepsItsKeys(event.target)) {
        input?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [introPlaying]);

  // The Text is veiled while the focus is lost, never during the Intro.
  const veiled = !focused && !introPlaying;

  return { inputRef, veiled, setFocused, focus };
};
