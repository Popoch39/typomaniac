import type { Key } from "typing-engine";

type KeyPress = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">;

// `key` is a single character for printable keys only, shortcuts are left to the browser.
export const isTypedKey = (event: KeyPress) =>
  event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

// The Key a key press means in a Run: a character, backspace, or Ctrl+Backspace to erase the
// word. Null for anything else, left to the browser.
export const toKey = (event: KeyPress): Key | null => {
  if (isTypedKey(event)) {
    return { kind: "char", char: event.key };
  }

  if (event.key !== "Backspace" || event.metaKey || event.altKey) {
    return null;
  }

  return event.ctrlKey ? { kind: "deleteWord" } : { kind: "backspace" };
};
