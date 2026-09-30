import { Link } from "@tanstack/react-router";

import { LogoSymbol } from "@/components/brand/logo-symbol";

// The Logo atop the sidebar and the Duel's scene: the bare symbol, then the word. Only its wave
// wears the accent, so that Jouer stays the sidebar's one fill of it. Leads to the play page. The
// word has its own element: the Intro measures its footprint, the sidebar growing from it.
export const BrandMark = () => (
  <Link
    to="/"
    data-intro="brand"
    className="flex items-center gap-1.5 rounded-2xl text-xl font-extrabold tracking-[-0.03em] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    <LogoSymbol className="size-9" />
    <span data-intro="brand-word" className="rail:sr-only">
      typomaniac
    </span>
  </Link>
);
