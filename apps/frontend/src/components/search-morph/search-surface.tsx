import { cn } from "cn";

// The surface of one of the search's forms (its fill, corners and shadow), a layer of its own under
// the form's content, for the search to move it alone from one form to the next. The form is
// `isolate`, or fixed.
export const SearchSurface = ({ className }: { className: string }) => (
  <div
    aria-hidden
    data-search-surface
    data-flip-id="search-surface"
    className={cn("absolute inset-0 -z-10", className)}
  />
);
