// The card that says « C'est parti ! » where the Duel comes from, marked so: the search's card on
// Jouer, the Queue pill, or an accepted Challenge's card, sent or received.
export const BRIDGE_CARD = "data-duel-bridge-card";

// A copy of that card, laid over the page where it was, and the box it had.
export type BridgeCard = { node: HTMLElement; rect: DOMRect };

// The attributes that mark the card or name what is in it: a copy loses them, never taken for the
// original, nor for a form of the search.
const MARKS = [
  "id",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "aria-live",
  BRIDGE_CARD,
  "data-search-form",
  "data-search-leaves",
  "data-search-surface",
  "data-search-ring",
  "data-flip-id",
  "data-intro",
];

// Above the page, the pill and the Challenges' cards; the Face-off, laid after it, goes over it.
const CARD_Z_INDEX = "60";

// Copies the card shown now, if any, and lays the copy over the page where the card is, before
// the card goes with the Match proposal or the Challenge: the Duel's bridge holds it from there,
// still, until the Face-off takes over. Hidden from assistive technologies: the Match proposal's
// announcer and the Face-off's say it.
export const layBridgeCard = (): BridgeCard | null => {
  const card = document.querySelector<HTMLElement>(`[${BRIDGE_CARD}]`);

  if (card === null) {
    return null;
  }

  const rect = card.getBoundingClientRect();
  // SAFETY: a deep copy of an HTMLElement is an HTMLElement.
  const node = card.cloneNode(true) as HTMLElement;

  for (const marked of [node, ...node.querySelectorAll<HTMLElement>("*")]) {
    for (const mark of MARKS) {
      marked.removeAttribute(mark);
    }
  }

  node.setAttribute("aria-hidden", "true");
  node.setAttribute("data-duel-bridge-copy", "");
  node.inert = true;
  Object.assign(node.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    zIndex: CARD_Z_INDEX,
    pointerEvents: "none",
  });
  document.body.append(node);

  return { node, rect };
};
