import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

// What the search's surface carries from one form to the other, besides its box.
export const MORPH_PROPS = "backgroundColor,borderRadius,boxShadow";

// A form of the search recorded up to a second ago still leads to the next one: the time for the
// router to show the page it goes to.
const FRESH_SECONDS = 1;

// A copy of what leaves with the form, laid where the original was, to fade out.
type Ghost = { node: HTMLElement; rect: DOMRect };

export type SearchForm = {
  // The surface and the ring, where they were.
  state: Flip.FlipState;
  // Whether it had the ring: the Ranked card has none, the search's ring appears with its content.
  ringed: boolean;
  ghosts: Ghost[];
  at: number;
};

// The attributes that mark the search's forms or name what is in them: a copy loses them, never
// taken for the original.
const MARKS = [
  "id",
  "role",
  "aria-label",
  "aria-labelledby",
  "data-search-form",
  "data-search-surface",
  "data-search-ring",
  "data-search-leaves",
  "data-flip-id",
  "data-intro",
];

const ghostOf = (element: HTMLElement): Ghost => {
  // SAFETY: a deep copy of an HTMLElement is an HTMLElement.
  const node = element.cloneNode(true) as HTMLElement;

  for (const marked of [node, ...node.querySelectorAll<HTMLElement>("*")]) {
    // The surface and the ring move to the next form: only the rest fades out where it was.
    if (marked.hasAttribute("data-search-ring")) {
      marked.style.visibility = "hidden";
    }

    if (marked.hasAttribute("data-search-surface")) {
      Object.assign(marked.style, { background: "none", boxShadow: "none" });
    }

    for (const mark of MARKS) {
      marked.removeAttribute(mark);
    }
  }

  node.setAttribute("aria-hidden", "true");
  node.setAttribute("data-search-ghost", "");
  node.inert = true;

  return { node, rect: element.getBoundingClientRect() };
};

let recorded: SearchForm | null = null;

// The form that came from it, the only one to read it: again, when StrictMode runs its effect twice.
let reader: Element | null = null;

// Records the search's form shown now (`data-search-form`): the Ranked card before the search is
// launched, the search's card before it folds, the Queue pill before it unfolds; and copies of
// what leaves with it (`data-search-leaves`). The next form to show comes from it.
export const recordSearchForm = () => {
  const form = document.querySelector<HTMLElement>("[data-search-form]");

  reader = null;

  if (form === null) {
    recorded = null;

    return;
  }

  // The form may be its own surface: the Ranked card.
  const moving = [form, ...form.querySelectorAll("*")].filter((element) =>
    element.matches("[data-search-surface], [data-search-ring]"),
  );

  recorded = {
    state: Flip.getState(moving, { props: MORPH_PROPS }),
    ringed: form.querySelector("[data-search-ring]") !== null,
    ghosts: [...document.querySelectorAll<HTMLElement>("[data-search-leaves]")].map(ghostOf),
    at: gsap.ticker.time,
  };
};

// The form the search comes from, for the first form of it to show (`to`): none if it was recorded
// too long ago, or already led to another.
export const lastSearchForm = (to: Element) => {
  if (recorded === null || gsap.ticker.time - recorded.at > FRESH_SECONDS) {
    return null;
  }

  reader ??= to;

  return reader === to ? recorded : null;
};

// Lays the copies over the page, where their originals were; the function returned takes them off.
export const layGhosts = (ghosts: Ghost[]) => {
  for (const { node, rect } of ghosts) {
    Object.assign(node.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      zIndex: "50",
      pointerEvents: "none",
    });
    document.body.append(node);
  }

  return () => {
    for (const { node } of ghosts) {
      node.remove();
    }
  };
};
