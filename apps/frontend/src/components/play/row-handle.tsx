import { atHandle } from "@/lib/at-handle";

// A Handle in a sentence of a card's list (`RowSentence`): the only part of the row that gives way
// to its width, a Handle long past the usual ending in an ellipsis, never below its first letters.
export const RowHandle = ({ handle }: { handle: string }) => (
  <span className="min-w-[5ch] truncate">{atHandle(handle)}</span>
);
