import { LOGO_DRAWINGS } from "@/components/brand/logo-drawings";
import { BOOT_SCALE } from "@/components/intro/intro-timelines";

const { stem, bar, wave } = LOGO_DRAWINGS.full;

// At the boot Logo's size from the first render. A transform, never Tailwind's `scale`: GSAP
// writes `transform`, which would add up with it.
const BOOT_SIZE = { transform: `scale(${BOOT_SCALE})` };

// The lockup's Logo, at 100.8 px, drawn as the boot Logo of index.html: the full drawing, the t in
// the Theme's text, the wave in its accent. The wave scales on its own box (`--intro-wave`), so
// that GSAP never writes the transform of an SVG element.
export const IntroLogo = () => (
  <span data-intro="logo" className="flex size-[100.8px] shrink-0" style={BOOT_SIZE}>
    <svg
      viewBox="0 0 100 100"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full overflow-visible"
    >
      <path d={stem.d} strokeWidth={stem.width} className="stroke-foreground" />
      <path d={bar.d} strokeWidth={bar.width} className="stroke-foreground" />
      <path
        data-intro="wave"
        d={wave.d}
        strokeWidth={wave.width}
        className="stroke-brand [scale:1_var(--intro-wave,1)] origin-center [transform-box:fill-box]"
      />
    </svg>
  </span>
);
