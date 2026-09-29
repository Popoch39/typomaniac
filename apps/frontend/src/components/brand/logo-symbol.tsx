import { cn } from "cn";

import { LOGO_DRAWINGS, type LogoDrawingName } from "@/components/brand/logo-drawings";

type LogoSymbolProps = {
  // The full drawing from 24 px, the simplified one below.
  drawing?: LogoDrawingName;
  // Its size.
  className: string;
};

// The Logo's symbol: the t in the Theme's text, its wave in the Theme's accent (`brand`: `accent` is
// shadcn's hover surface), so that it follows the nearest `data-theme`, the page's or a Theme's
// preview card. A picture only: the word beside it names it. The symbol and its wave are marked
// (`data-logo`) for the Intro, which lands on the sidebar's and redraws its wave.
export const LogoSymbol = ({ drawing = "full", className }: LogoSymbolProps) => {
  const { stem, bar, wave } = LOGO_DRAWINGS[drawing];

  return (
    <svg
      data-logo="symbol"
      viewBox="0 0 100 100"
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      <path d={stem.d} strokeWidth={stem.width} className="stroke-foreground" />
      <path d={bar.d} strokeWidth={bar.width} className="stroke-foreground" />
      <path data-logo="wave" d={wave.d} strokeWidth={wave.width} className="stroke-brand" />
    </svg>
  );
};
