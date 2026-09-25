import { Link } from "@tanstack/react-router";

// The app's name in the header: the accent square with its "t", then the word. Leads to the play page.
export const BrandMark = () => (
  <Link
    to="/"
    className="flex items-center gap-2.5 rounded-2xl text-xl font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    <span
      aria-hidden="true"
      className="flex size-9 items-center justify-center rounded-xl bg-brand text-base text-primary-foreground"
    >
      t
    </span>
    typomaniac
  </Link>
);
