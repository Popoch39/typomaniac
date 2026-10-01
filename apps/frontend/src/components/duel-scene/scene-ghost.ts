// Over the Duel's scene and the Duel end, under the dialogs.
const GHOST_Z_INDEX = "40";

// The attributes that name an element or mark it for its own animations: a copy loses them, never
// taken for the original.
const MARKS = [
  "id",
  "role",
  "aria-label",
  "aria-labelledby",
  "aria-live",
  "data-duel-band",
  "data-round-head",
  "data-duel-text-card",
  "data-rb",
];

// An element of the Duel's scene as it stood when recorded, to come out of: where it was on the
// screen (the scene scaled in), its size as laid out, and a copy of it, laid at the top left of the
// screen, whose transform puts it there.
export type SceneGhost = { rect: DOMRect; width: number; height: number; ghost: HTMLElement };

// A copy of `element`, inert and hidden from assistive technology, its marked parts `hidden` left
// out (their place kept).
const ghostOf = (element: HTMLElement, hidden: string | null) => {
  // SAFETY: a deep copy of an HTMLElement is an HTMLElement.
  const node = element.cloneNode(true) as HTMLElement;

  for (const marked of [node, ...node.querySelectorAll<HTMLElement>("*")]) {
    if (hidden !== null && marked.matches(hidden)) {
      marked.style.visibility = "hidden";
    }

    for (const mark of MARKS) {
      marked.removeAttribute(mark);
    }
  }

  node.setAttribute("aria-hidden", "true");
  node.inert = true;
  Object.assign(node.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${element.offsetWidth}px`,
    height: `${element.offsetHeight}px`,
    margin: "0",
    transformOrigin: "0 0",
    zIndex: GHOST_Z_INDEX,
    pointerEvents: "none",
  });

  return node;
};

// The element matching `selector` shown now, recorded with a copy of it (`mark` set on the copy),
// its parts matching `hidden` left out; null when none is shown.
export const recordSceneGhost = (
  selector: string,
  mark: string,
  hidden: string | null = null,
): SceneGhost | null => {
  const element = document.querySelector<HTMLElement>(selector);

  if (element === null) {
    return null;
  }

  const ghost = ghostOf(element, hidden);

  ghost.setAttribute(mark, "");

  return {
    rect: element.getBoundingClientRect(),
    width: element.offsetWidth,
    height: element.offsetHeight,
    ghost,
  };
};

// A size over another, 1 without one to divide by (a box not laid out).
export const ratio = (size: number, of: number) => (of > 0 ? size / of : 1);

// Lays the copy over the screen where its element was.
export const layGhost = ({ ghost, rect, width, height }: SceneGhost) => {
  document.body.append(ghost);
  Object.assign(ghost.style, {
    transform: `translate(${rect.left}px, ${rect.top}px) scale(${ratio(rect.width, width)}, ${ratio(rect.height, height)})`,
  });
};
