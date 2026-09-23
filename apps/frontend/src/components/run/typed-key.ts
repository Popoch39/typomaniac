type KeyPress = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">;

// `key` is a single character for printable keys only, shortcuts are left to the browser.
export const isTypedKey = (event: KeyPress) =>
  event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
