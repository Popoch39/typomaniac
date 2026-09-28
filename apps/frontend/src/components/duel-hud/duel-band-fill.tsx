import { cn } from "cn";

import { DuelBandMarquee } from "@/components/duel-hud/duel-band-marquee";

// Each side of the split between the two colours, cut on a slant of 26 px each side of its
// middle. The split itself is `--split`, in % of the band's width, which GSAP slides.
const OWN_CLIP = {
  clipPath:
    "polygon(0 0, calc(var(--split, 50) * 1% + 26px) 0, calc(var(--split, 50) * 1% - 26px) 100%, 0 100%)",
};

const OPPONENT_CLIP = {
  clipPath:
    "polygon(calc(var(--split, 50) * 1% + 26px) 0, 100% 0, 100% 100%, calc(var(--split, 50) * 1% - 26px) 100%)",
};

type DuelBandFillProps = {
  // Null while this User's is not read yet: no Handle behind their half.
  handle: string | null;
  // The opponent's lies on the band's own blue: it only holds their Handle.
  mirrored: boolean;
};

// One player's side of the split: this User's in their accent, the opponent's on the band's blue,
// each with their Handle repeated behind.
export const DuelBandFill = ({ handle, mirrored }: DuelBandFillProps) => (
  <div
    aria-hidden="true"
    style={mirrored ? OPPONENT_CLIP : OWN_CLIP}
    className={cn("absolute inset-0", !mirrored && "bg-brand")}
  >
    {handle === null ? null : <DuelBandMarquee handle={handle} mirrored={mirrored} />}
  </div>
);
