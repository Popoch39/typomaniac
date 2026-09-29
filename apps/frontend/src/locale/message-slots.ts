import { createElement, Fragment, type ReactNode } from "react";

// Stands for an input in the text of a message, around the input's name: a private-use character,
// never in a message.
const MARK = "\u{E000}";

// A message whose inputs are elements rather than text (a Handle's link, a name in bold): the
// message is said with a mark for each input, then cut at the marks, each element put back where
// its input stands. The word order stays the message's, in every Locale.
export const withSlots = <Slot extends string>(
  say: (marks: Record<Slot, string>) => string,
  elements: Record<Slot, ReactNode>,
) => {
  const byName = new Map<string, ReactNode>(Object.entries(elements));

  // SAFETY: one mark for each key of `elements`, whose keys are exactly the Slots.
  const marks = Object.fromEntries(
    [...byName.keys()].map((name) => [name, `${MARK}${name}${MARK}`]),
  ) as Record<Slot, string>;

  // Cut at the marks, the text and the inputs' names alternate: the names are at the odd places.
  const parts = say(marks)
    .split(MARK)
    .map((part, index) => (index % 2 === 1 ? byName.get(part) : part));

  // Handed one by one, as JSX hands its children: a fixed sentence, whose parts need no key.
  return createElement(Fragment, null, ...parts);
};
